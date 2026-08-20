"""
opsec-scan CLI entrypoint.

Usage:
    opsec-scan --init-profile
    opsec-scan --repo /path/to/local/repo --profile target_profile.yaml
    opsec-scan --repo /path/to/repo --media-dir ./screenshots --output report.html
    opsec-scan --repo /path/to/repo --pdf-output report.pdf
    opsec-scan --repo /path/to/repo --since-ref origin/main --fail-on CRITICAL   # CI/pre-push use
    opsec-scan --repo /path/to/repo --sarif-output report.sarif                  # GitHub/GitLab PR checks

A project can also set defaults in ./opsec-scan.yaml (see opsec-scan.example.yaml)
instead of repeating flags every run — any flag passed on the command line
still overrides the config file.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from rich.console import Console
from rich.progress import BarColumn, Progress, TextColumn, TimeElapsedColumn

from opsec_scanner.config import load_target_profile, write_template_profile
from opsec_scanner.config_loader import load_config
from opsec_scanner.engines.git_engine import scan_git_repo
from opsec_scanner.engines.media_engine import scan_media_dir
from opsec_scanner.analysis.patterns import scan_findings, load_rules
from opsec_scanner.scoring.risk_engine import score_findings, deduplicate_findings, ExposureLevel
from opsec_scanner.output.dashboard import render_dashboard
from opsec_scanner.output.json_export import export_json
from opsec_scanner.output.pdf_export import export_pdf
from opsec_scanner.output.sarif_export import export_sarif
from opsec_scanner.output.history_store import save_snapshot
from opsec_scanner.output.ops_center import render_ops_center

console = Console()

_RISK_ORDER = {"LOW": 0, "MEDIUM": 1, "HIGH": 2, "CRITICAL": 3}


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="opsec-scan",
        description="Self-audit OPSEC leak scanner: git history, media metadata, identity correlation.",
    )
    parser.add_argument("--init-profile", action="store_true", help="Write a template target_profile.yaml and exit.")
    parser.add_argument("--config", type=str, default=None, help="Path to project config YAML (default: ./opsec-scan.yaml if present)")
    parser.add_argument("--profile", type=str, default=None, help="Path to target profile YAML (default: ./target_profile.yaml)")
    parser.add_argument("--repo", type=str, action="append", default=[], help="Path to a local git repo to scan. Can be passed multiple times.")
    parser.add_argument("--media-dir", type=str, action="append", default=[], help="Path to a directory of images/PDFs/docs to scan. Can be passed multiple times.")
    parser.add_argument("--since-ref", type=str, default=None, help="Only scan commits in <ref>..HEAD instead of full history (e.g. 'origin/main' in a pre-push hook).")
    parser.add_argument("--output", type=str, default="opsec_report.html", help="Output HTML report path. Default: ./opsec_report.html")
    parser.add_argument("--json-output", type=str, default=None, help="Optional path to also export raw findings as JSON.")
    parser.add_argument("--sarif-output", type=str, default=None, help="Optional path to also export SARIF 2.1.0 (for GitHub/GitLab PR checks).")
    parser.add_argument("--pdf-output", type=str, default=None, help="Optional path to also export a static PDF report.")
    parser.add_argument("--reveal-in-pdf", action="store_true", help="Show secret values in full in the PDF export. Personal use only — do not distribute.")
    parser.add_argument("--reveal-in-json", action="store_true", help="Show secret values in full in the JSON export. Personal use only — do not distribute.")
    parser.add_argument("--reveal-in-sarif", action="store_true", help="Show secret values in full in the SARIF export. Not recommended for PR checks.")
    parser.add_argument("--entropy-threshold", type=float, default=3.5, help="Shannon entropy threshold for flagging high-randomness strings (default: 3.5)")
    parser.add_argument("--max-patch-commits", type=int, default=500, help="Cap on how many commits to run patch-diffing against (default: 500, use 0 for unlimited)")
    parser.add_argument("--public-repo", action="store_true", help="Treat scanned targets as already publicly exposed (forces exposure weight to 1.0x instead of the local-only default).")
    parser.add_argument(
        "--fail-on",
        type=str,
        default="NONE",
        choices=["CRITICAL", "HIGH", "MEDIUM", "LOW", "NONE"],
        help="Exit with status 1 if any finding meets or exceeds this risk level. Default: NONE (never fail the process).",
    )
    parser.add_argument("--no-progress", action="store_true", help="Disable progress bars (useful for CI log output).")
    parser.add_argument("--save-history", action="store_true", help="Save this scan's summary to the local history store (./.opsec-scan/history/ by default) for Operations Center trend tracking.")
    parser.add_argument("--history-dir", type=str, default=None, help="Path to the history store directory. Default: ./.opsec-scan/history/")
    parser.add_argument("--target-label", type=str, default=None, help="Label for this scan in the history store (default: derived from --repo/--media-dir paths).")
    parser.add_argument("--ops-center-output", type=str, default=None, help="Render the Operations Center dashboard (trend across all saved history) to this HTML path and exit. Does not run a new scan.")
    return parser


def _resolve_config_defaults(argv: list[str]) -> dict:
    """Peeks at --config before the real parse, so config-file values can
    be set as argparse defaults (and therefore overridden by any flag
    actually present in argv)."""
    peek = argparse.ArgumentParser(add_help=False)
    peek.add_argument("--config", type=str, default=None)
    known, _ = peek.parse_known_args(argv)
    return load_config(known.config)


def cli() -> None:
    argv = sys.argv[1:]
    parser = build_arg_parser()

    config_defaults = _resolve_config_defaults(argv)
    if config_defaults:
        parser.set_defaults(**config_defaults)

    args = parser.parse_args(argv)

    if args.init_profile:
        write_template_profile()
        sys.exit(0)

    if args.ops_center_output:
        history_dir = args.history_dir or None
        render_ops_center(history_dir, args.ops_center_output)
        console.print(f"[green]Operations Center dashboard written to:[/green] {args.ops_center_output}")
        sys.exit(0)

    if not args.repo and not args.media_dir:
        parser.error("Provide at least one --repo or --media-dir to scan.")

    profile = load_target_profile(args.profile)
    console.print(f"[bold]Target profile:[/bold] {profile.name} ({len(profile.all_identity_strings())} identity anchors)")

    all_findings = []
    combined_stats: dict = {}
    max_patch_commits = None if args.max_patch_commits == 0 else args.max_patch_commits
    show_progress = not args.no_progress

    for repo_path in args.repo:
        console.print(f"[bold]Scanning git repo:[/bold] {repo_path}")
        repo_stats: dict = {}

        if show_progress:
            with Progress(
                TextColumn("  [cyan]{task.description}"),
                BarColumn(),
                TextColumn("{task.completed}/{task.total}"),
                TimeElapsedColumn(),
                console=console,
                transient=True,
            ) as progress:
                task_id = progress.add_task("walking commit history", total=None)

                def _cb(done: int, total: int, _task_id=task_id, _progress=progress):
                    _progress.update(_task_id, completed=done, total=total)

                findings = scan_git_repo(
                    Path(repo_path),
                    max_patch_commits=max_patch_commits,
                    since_ref=args.since_ref,
                    stats=repo_stats,
                    progress_callback=_cb,
                )
        else:
            findings = scan_git_repo(
                Path(repo_path),
                max_patch_commits=max_patch_commits,
                since_ref=args.since_ref,
                stats=repo_stats,
            )

        console.print(f"  -> {len(findings)} raw findings extracted ({repo_stats.get('scan_mode', 'unknown mode')}, {repo_stats.get('commits_scanned', 0)} commits)")
        all_findings.extend(findings)
        for k, v in repo_stats.items():
            if isinstance(v, int):
                combined_stats[k] = combined_stats.get(k, 0) + v
            else:
                combined_stats[k] = v

    total_media_scanned = 0
    for media_path in args.media_dir:
        console.print(f"[bold]Scanning media dir:[/bold] {media_path}")

        if show_progress:
            with Progress(
                TextColumn("  [cyan]{task.description}"),
                BarColumn(),
                TextColumn("{task.completed}/{task.total}"),
                TimeElapsedColumn(),
                console=console,
                transient=True,
            ) as progress:
                task_id = progress.add_task("processing media files", total=None)

                def _media_cb(done: int, total: int, path: Path, _task_id=task_id, _progress=progress):
                    _progress.update(_task_id, completed=done, total=total, description=f"processing media files ({path.name})")

                findings = scan_media_dir(Path(media_path), progress_callback=_media_cb)
        else:
            findings = scan_media_dir(Path(media_path))

        console.print(f"  -> {len(findings)} raw findings extracted")
        all_findings.extend(findings)
        total_media_scanned += sum(1 for _ in Path(media_path).rglob("*") if _.is_file())

    if total_media_scanned:
        combined_stats["media_files_scanned"] = total_media_scanned

    console.print(f"[bold]Total raw findings collected:[/bold] {len(all_findings)}")

    rules = load_rules()
    matches = scan_findings(all_findings, rules, entropy_threshold=args.entropy_threshold)
    console.print(f"[bold]{len(matches)}[/bold] findings matched a detection rule")

    exposure_override = ExposureLevel.PUBLIC_REACHABLE if args.public_repo else None
    scored = score_findings(matches, profile, exposure_override=exposure_override)
    scored = deduplicate_findings(scored)
    console.print(f"[bold]{len(scored)}[/bold] unique findings after deduplication")

    if args.save_history:
        label = args.target_label or "+".join(args.repo + args.media_dir) or "unlabeled-target"
        snapshot_path = save_snapshot(scored, label, history_dir=args.history_dir)
        console.print(f"[green]Scan snapshot saved to history:[/green] {snapshot_path}")

    render_dashboard(scored, args.output, scan_stats=combined_stats)
    console.print(f"[green]HTML report written to:[/green] {args.output}")

    if args.json_output:
        export_json(scored, args.json_output, reveal=args.reveal_in_json)
        redaction_note = "revealed" if args.reveal_in_json else "redacted"
        console.print(f"[green]JSON export written to:[/green] {args.json_output} ({redaction_note})")

    if args.sarif_output:
        export_sarif(scored, args.sarif_output, reveal=args.reveal_in_sarif)
        console.print(f"[green]SARIF export written to:[/green] {args.sarif_output}")

    if args.pdf_output:
        export_pdf(scored, args.pdf_output, reveal=args.reveal_in_pdf, scan_stats=combined_stats)
        redaction_note = "values revealed, personal-use copy" if args.reveal_in_pdf else "values redacted"
        console.print(f"[green]PDF report written to:[/green] {args.pdf_output} ({redaction_note})")

    if scored:
        top = scored[0]
        console.print(f"[bold]Top finding:[/bold] {top.risk_label} ({top.risk_score}) — {top.match.rule_id}")

    if args.fail_on != "NONE":
        threshold = _RISK_ORDER[args.fail_on]
        blocking = [s for s in scored if _RISK_ORDER.get(s.risk_label, 0) >= threshold]
        if blocking:
            console.print(f"[bold red]FAILING:[/bold red] {len(blocking)} finding(s) at or above {args.fail_on}")
            sys.exit(1)

    sys.exit(0)


if __name__ == "__main__":
    cli()
