"""
Operations Center report.

Extends the case-file design language from dashboard.py rather than
introducing a new visual style — same tokens, same "chain of custody"
framing — but shows trend-over-time across many scans instead of one
scan's findings. This is the piece that actually earns the "operations
center" name: continuous status, not a single point-in-time snapshot.

Shows: per-target current status, a trend strip (finding counts over
recent scans), and the new/resolved/still-open diff against the
previous scan for each monitored target.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

from opsec_scanner.output.history_store import diff_latest_two, load_history

_STAMP_COLORS = {
    "CRITICAL": "#c0433f",
    "HIGH": "#c07f3f",
    "MEDIUM": "#b8a13f",
    "LOW": "#3f8f6e",
}


def _esc(s: str) -> str:
    return (
        str(s)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def _fmt_ts(iso_ts: str) -> str:
    try:
        dt = datetime.fromisoformat(iso_ts)
        return dt.strftime("%Y-%m-%d %H:%M UTC")
    except (ValueError, TypeError):
        return iso_ts


def _target_status_html(target_label: str, snapshots: list[dict]) -> str:
    latest = snapshots[-1]
    counts = latest["counts_by_label"]

    tallies = "".join(
        f'<div class="tally"><div class="tally-stamp" style="--stamp-color:{_STAMP_COLORS[label]}">{label}</div>'
        f'<div class="tally-count">{counts.get(label, 0):02d}</div></div>'
        for label in ("CRITICAL", "HIGH", "MEDIUM", "LOW")
    )

    # Trend strip: last up to 10 scans as small bars, height proportional
    # to total findings that run — cheap visual for "is this getting
    # better or worse" without a charting library.
    recent = snapshots[-10:]
    max_total = max((s["total_findings"] for s in recent), default=1) or 1
    trend_bars = "".join(
        f'<div class="trend-bar" style="height:{max(4, int((s["total_findings"] / max_total) * 40))}px" '
        f'title="{_esc(_fmt_ts(s["timestamp"]))}: {s["total_findings"]} findings"></div>'
        for s in recent
    )

    diff = diff_latest_two(snapshots)
    diff_html = ""
    if diff["comparable"]:
        new_count = len(diff["new"])
        resolved_count = len(diff["resolved"])
        still_open_count = len(diff["still_open"])
        diff_html = f"""
        <div class="diff-row">
          <span class="diff-chip diff-new">+{new_count} new</span>
          <span class="diff-chip diff-resolved">-{resolved_count} resolved</span>
          <span class="diff-chip diff-open">{still_open_count} still open</span>
          <span class="diff-since">since {_esc(_fmt_ts(diff['previous_timestamp']))}</span>
        </div>
        """
        if diff["new"]:
            new_items = "".join(
                f'<li><span class="stamp" style="--stamp-color:{_STAMP_COLORS.get(f["risk_label"], "#6b7280")}">{f["risk_label"]}</span> '
                f'{_esc(f["rule_id"])} <span class="origin">{_esc(f["origin"])}</span></li>'
                for f in diff["new"]
            )
            diff_html += f'<ul class="diff-list">{new_items}</ul>'
    else:
        diff_html = '<div class="diff-note">First scan on record for this target — no prior snapshot to compare against.</div>'

    return f"""
    <article class="target-card">
      <div class="target-head">
        <h2 class="target-name">{_esc(target_label)}</h2>
        <span class="target-meta">last scanned {_esc(_fmt_ts(latest['timestamp']))} · {len(snapshots)} scan(s) on record</span>
      </div>
      <div class="tallies">{tallies}</div>
      <div class="trend-strip">{trend_bars}</div>
      {diff_html}
    </article>
    """


def render_ops_center(history_dir: Path | str, output_path: str | Path) -> None:
    history = load_history(history_dir)
    generated_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    by_target: dict[str, list[dict]] = defaultdict(list)
    for snapshot in history:
        by_target[snapshot["target_label"]].append(snapshot)

    total_targets = len(by_target)
    total_open_critical = sum(
        snapshots[-1]["counts_by_label"].get("CRITICAL", 0) for snapshots in by_target.values()
    )

    if by_target:
        target_cards = "".join(
            _target_status_html(label, snapshots) for label, snapshots in sorted(by_target.items())
        )
    else:
        target_cards = '<div class="clean-record">NO SCAN HISTORY — run with --save-history to start building a monitoring record.</div>'

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>OPSEC Operations Center</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root {{
    --ink: #0d0f12; --panel: #15181a; --panel-raised: #191d20; --line: #262b2e;
    --text: #dde1e3; --muted: #7a8288; --muted-dim: #565d62;
    --mono: 'IBM Plex Mono', ui-monospace, Consolas, monospace;
    --sans: 'IBM Plex Sans', -apple-system, 'Segoe UI', sans-serif;
  }}
  * {{ box-sizing: border-box; }}
  body {{ background: var(--ink); color: var(--text); font-family: var(--sans); margin: 0; padding: 0 0 100px; font-size: 15px; line-height: 1.5; }}
  .sheet {{ max-width: 860px; margin: 0 auto; padding: 0 28px; }}

  .cover {{ border-bottom: 1px solid var(--line); padding: 48px 0 28px; }}
  .cover-eyebrow {{ font-family: var(--mono); font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); }}
  .cover-title {{ font-family: var(--mono); font-weight: 700; font-size: 26px; letter-spacing: -0.01em; margin: 6px 0 18px; }}
  .cover-meta {{ display: flex; flex-wrap: wrap; gap: 20px 32px; font-family: var(--mono); font-size: 12px; color: var(--muted); }}
  .cover-meta strong {{ color: var(--text); font-weight: 500; }}

  .target-card {{ background: var(--panel); border: 1px solid var(--line); border-radius: 4px; padding: 20px; margin: 20px 0; }}
  .target-head {{ display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }}
  .target-name {{ font-family: var(--mono); font-size: 16px; margin: 0; }}
  .target-meta {{ font-family: var(--mono); font-size: 11px; color: var(--muted); }}

  .tallies {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 14px; }}
  .tally {{ background: var(--panel-raised); border: 1px solid var(--line); border-radius: 3px; padding: 10px 8px; text-align: center; }}
  .tally-stamp {{ display: inline-block; font-family: var(--mono); font-size: 9px; font-weight: 700; letter-spacing: 0.1em; color: var(--stamp-color); border: 1.5px solid var(--stamp-color); border-radius: 2px; padding: 1px 5px; transform: rotate(-1deg); margin-bottom: 6px; }}
  .tally-count {{ font-family: var(--mono); font-size: 20px; font-weight: 600; }}

  .trend-strip {{ display: flex; align-items: flex-end; gap: 3px; height: 44px; margin-bottom: 14px; padding: 2px 0; }}
  .trend-bar {{ flex: 1; background: var(--muted-dim); border-radius: 1px; min-width: 6px; max-width: 20px; }}

  .diff-row {{ display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-family: var(--mono); font-size: 11px; }}
  .diff-chip {{ padding: 2px 8px; border-radius: 10px; border: 1px solid var(--line); }}
  .diff-new {{ color: #c0433f; border-color: #4b2c2c; }}
  .diff-resolved {{ color: #3f8f6e; border-color: #2c4b3e; }}
  .diff-open {{ color: var(--muted); }}
  .diff-since {{ color: var(--muted-dim); margin-left: auto; }}
  .diff-note {{ font-family: var(--mono); font-size: 11px; color: var(--muted-dim); font-style: italic; }}
  .diff-list {{ list-style: none; padding: 0; margin: 10px 0 0; font-size: 12px; }}
  .diff-list li {{ padding: 4px 0; border-top: 1px solid var(--line); color: var(--muted); }}
  .diff-list .origin {{ color: var(--muted-dim); }}
  .stamp {{ font-family: var(--mono); font-size: 9px; font-weight: 700; letter-spacing: 0.06em; color: var(--stamp-color); border: 1.5px solid var(--stamp-color); border-radius: 2px; padding: 1px 5px; margin-right: 6px; }}

  .clean-record {{ font-family: var(--mono); text-align: center; padding: 60px 20px; color: var(--muted); }}

  @media (max-width: 600px) {{ .tallies {{ grid-template-columns: repeat(2, 1fr); }} }}
</style>
</head>
<body>
  <div class="sheet">
    <header class="cover">
      <div class="cover-eyebrow">Continuous monitoring · operations center</div>
      <h1 class="cover-title">OPSEC Operations Center</h1>
      <div class="cover-meta">
        <span>Generated <strong>{generated_at}</strong></span>
        <span>Targets monitored <strong>{total_targets}</strong></span>
        <span>Open CRITICAL across all targets <strong>{total_open_critical}</strong></span>
      </div>
    </header>
    {target_cards}
  </div>
</body>
</html>"""

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html)
