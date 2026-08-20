"""
Git & Code History Engine.

Walks the FULL commit history of a local repo — not just HEAD — because
most real leaks live in commits nobody looks at: old author signatures,
abandoned branches, and lines that were added and then deleted in a later
commit (deleted != gone, it's still in the object database).

Three extraction passes:
  1. Commit metadata (author/committer name+email, timestamps, paths touched)
  2. Reflog / dangling commit scan (orphaned refs still reachable in .git)
  3. Patch diffing (line-level additions/deletions per commit)

This module only extracts and yields RawFinding objects. No scoring,
no regex matching happens here — that's analysis/patterns.py and
analysis/entropy.py's job. Keeping extraction and analysis separate
means you can swap in a Rust/gix backend later without touching the
scoring pipeline.
"""

from __future__ import annotations

from pathlib import Path
from typing import Callable, Iterator

from git import Repo, InvalidGitRepositoryError, NoSuchPathError, NULL_TREE
from git.objects.commit import Commit

from opsec_scanner.models import RawFinding, SourceType

# Paths that are near-always sensitive regardless of content —
# flagged directly at the path-scan stage, no regex needed.
SENSITIVE_PATH_MARKERS = (
    ".env",
    "id_rsa",
    "id_ed25519",
    ".pem",
    ".pfx",
    "shadow",
    ".pgpass",
    ".netrc",
    "credentials.json",
    "secrets.yaml",
    "secrets.yml",
)


def _open_repo(repo_path: Path) -> Repo:
    try:
        return Repo(repo_path)
    except (InvalidGitRepositoryError, NoSuchPathError) as e:
        raise ValueError(f"'{repo_path}' is not a valid git repository: {e}")


def scan_commit_metadata(repo: Repo, origin: str) -> Iterator[RawFinding]:
    """
    Pass 1: walk every commit reachable from every branch/ref (not just
    the current HEAD), yielding author/committer identity + path findings.
    """
    seen_shas: set[str] = set()

    for ref in repo.refs:
        try:
            commits = repo.iter_commits(ref, max_count=None)
        except Exception:
            continue  # unresolvable ref (e.g. dangling symbolic ref)

        for commit in commits:
            if commit.hexsha in seen_shas:
                continue
            seen_shas.add(commit.hexsha)
            yield from _findings_from_commit(commit, origin)


def _findings_from_commit(commit: Commit, origin: str) -> Iterator[RawFinding]:
    context = f"commit {commit.hexsha[:10]}"

    # Author / committer identity — the classic "leaked personal email"
    # or "local machine hostname in .local domain" signal.
    for role, actor in (("author", commit.author), ("committer", commit.committer)):
        if actor.email:
            yield RawFinding(
                source_type=SourceType.GIT_COMMIT_META,
                raw_text=actor.email,
                context=f"{context} ({role} email)",
                origin=origin,
                metadata={
                    "role": role,
                    "name": actor.name,
                    "commit_sha": commit.hexsha,
                    "authored_date": commit.authored_datetime.isoformat(),
                },
            )
        if actor.name:
            yield RawFinding(
                source_type=SourceType.GIT_COMMIT_META,
                raw_text=actor.name,
                context=f"{context} ({role} name)",
                origin=origin,
                metadata={"role": role, "commit_sha": commit.hexsha},
            )

    # File paths touched in this commit — cheap, high-signal scan for
    # secrets-shaped filenames and personal home-directory paths.
    try:
        for path in commit.stats.files.keys():
            lowered = path.lower()
            if any(marker in lowered for marker in SENSITIVE_PATH_MARKERS) or "/users/" in lowered or "\\users\\" in lowered:
                yield RawFinding(
                    source_type=SourceType.GIT_PATH,
                    raw_text=path,
                    context=f"{context} (file path)",
                    origin=origin,
                    metadata={"commit_sha": commit.hexsha},
                )
    except Exception:
        # some commits (e.g. merge commits with no parent diff) can raise here
        pass


def scan_dangling_commits(repo: Repo, origin: str) -> Iterator[RawFinding]:
    """
    Pass 2: find commits reachable via reflog but not via any current
    branch/tag ref — these are exactly the "I force-pushed to hide it"
    or "deleted branch but object database still has it" cases.
    """
    reachable_from_refs: set[str] = set()
    for ref in repo.refs:
        try:
            for commit in repo.iter_commits(ref, max_count=None):
                reachable_from_refs.add(commit.hexsha)
        except Exception:
            continue

    try:
        reflog_entries = repo.git.reflog("show", "--all", "--format=%H").splitlines()
    except Exception:
        reflog_entries = []

    dangling_shas = {sha for sha in reflog_entries if sha and sha not in reachable_from_refs}

    for sha in dangling_shas:
        try:
            commit = repo.commit(sha)
        except Exception:
            continue
        yield RawFinding(
            source_type=SourceType.GIT_DANGLING,
            raw_text=f"Dangling commit {sha[:10]} authored by {commit.author.name} <{commit.author.email}>",
            context="reflog-only, not reachable from any current branch/tag",
            origin=origin,
            metadata={"commit_sha": sha, "authored_date": commit.authored_datetime.isoformat()},
        )
        # Recurse the metadata/patch scan into dangling commits too —
        # this is often where the actually-interesting leaks hide.
        yield from _findings_from_commit(commit, origin)


def scan_patches(
    repo: Repo,
    origin: str,
    max_commits: int | None = 500,
    progress_callback: "Callable[[int, int], None] | None" = None,
) -> Iterator[RawFinding]:
    """
    Pass 3: diff each commit against its parent(s) and yield every added
    or removed line as a raw candidate string. This is intentionally
    unfiltered — regex/entropy scoring happens downstream in analysis/.

    max_commits caps this pass by default since patch diffing is the
    most expensive operation; pass None to scan full history on smaller repos.

    progress_callback(commits_processed, commits_total), if given, fires
    after each commit's diff completes — this is the slowest pass in the
    pipeline, so it's the one most worth showing progress for.
    """
    count = 0
    seen_shas: set[str] = set()

    # Need a total up front for a meaningful progress bar (not just a
    # spinner) — cheap since it's just walking commit objects, not diffing.
    total_commits = 0
    for ref in repo.refs:
        try:
            total_commits += sum(1 for _ in repo.iter_commits(ref, max_count=None))
        except Exception:
            continue
    if max_commits is not None:
        total_commits = min(total_commits, max_commits)

    for ref in repo.refs:
        try:
            commits = repo.iter_commits(ref, max_count=None)
        except Exception:
            continue

        for commit in commits:
            if commit.hexsha in seen_shas:
                continue
            seen_shas.add(commit.hexsha)

            if max_commits is not None and count >= max_commits:
                return
            count += 1
            if progress_callback:
                progress_callback(count, total_commits)

            parents = commit.parents
            # Root commits (no parent) were previously skipped here on the
            # assumption their diff was "just noise" — but that meant any
            # secret committed in a repo's very first commit was completely
            # invisible to patch scanning, which is a real gap, not an edge
            # case. Diff against git's empty tree instead, which yields the
            # same "+" lines for the root commit's initial content that a
            # normal parent-diff would for any later commit.
            diff_targets = list(parents) if parents else [NULL_TREE]

            for parent in diff_targets:
                try:
                    diffs = commit.diff(parent, create_patch=True) if parent is NULL_TREE else parent.diff(commit, create_patch=True)
                except Exception:
                    continue

                for diff in diffs:
                    try:
                        patch_text = diff.diff.decode("utf-8", errors="replace")
                    except Exception:
                        continue

                    for line_no, line in enumerate(patch_text.splitlines()):
                        if line.startswith(("+", "-")) and not line.startswith(("+++", "---")):
                            content = line[1:].strip()
                            if not content:
                                continue
                            yield RawFinding(
                                source_type=SourceType.GIT_PATCH,
                                raw_text=content,
                                context=f"commit {commit.hexsha[:10]}, file {diff.b_path or diff.a_path}, line {line_no}",
                                origin=origin,
                                metadata={
                                    "commit_sha": commit.hexsha,
                                    "change_type": "added" if line.startswith("+") else "removed",
                                    "file": diff.b_path or diff.a_path,
                                },
                            )


def scan_commits_in_range(repo: Repo, origin: str, since_ref: str) -> Iterator[RawFinding]:
    """
    Incremental scan for pre-commit/pre-push hook use: only walks commits
    in `since_ref..HEAD` instead of full history. This is what makes the
    tool usable as an automatic gate rather than something run manually
    for a one-off audit — full-history scanning on every push doesn't
    scale, but scanning just the commits about to be pushed does.

    Runs metadata + patch diffing on the range; dangling-commit recovery
    is skipped here since it's a full-history concern, not specific to
    what's being pushed right now.
    """
    try:
        commits = list(repo.iter_commits(f"{since_ref}..HEAD"))
    except Exception as e:
        raise ValueError(f"Could not resolve commit range '{since_ref}..HEAD': {e}")

    for commit in commits:
        yield from _findings_from_commit(commit, origin)

    for commit in commits:
        parents = commit.parents
        # Same fix as scan_patches: root commits get diffed against the
        # empty tree instead of skipped, so a secret in a repo's first
        # commit isn't invisible to an incremental pre-push scan either.
        diff_targets = list(parents) if parents else [NULL_TREE]
        for parent in diff_targets:
            try:
                diffs = commit.diff(parent, create_patch=True) if parent is NULL_TREE else parent.diff(commit, create_patch=True)
            except Exception:
                continue
            for diff in diffs:
                try:
                    patch_text = diff.diff.decode("utf-8", errors="replace")
                except Exception:
                    continue
                for line_no, line in enumerate(patch_text.splitlines()):
                    if line.startswith(("+", "-")) and not line.startswith(("+++", "---")):
                        content = line[1:].strip()
                        if not content:
                            continue
                        yield RawFinding(
                            source_type=SourceType.GIT_PATCH,
                            raw_text=content,
                            context=f"commit {commit.hexsha[:10]}, file {diff.b_path or diff.a_path}, line {line_no}",
                            origin=origin,
                            metadata={
                                "commit_sha": commit.hexsha,
                                "change_type": "added" if line.startswith("+") else "removed",
                                "file": diff.b_path or diff.a_path,
                            },
                        )


def scan_git_repo(
    repo_path: Path,
    max_patch_commits: int | None = 500,
    since_ref: str | None = None,
    stats: dict | None = None,
    progress_callback: "Callable[[int, int], None] | None" = None,
) -> list[RawFinding]:
    """
    Entrypoint used by main.py. Runs all three passes and returns a
    flat list of RawFinding objects ready for the analysis layer.

    since_ref: if set (e.g. "origin/main" in a pre-push hook), scans only
    commits in `since_ref..HEAD` instead of full history — see
    scan_commits_in_range for why this matters for hook use.

    stats: if a dict is passed, it's populated in place with scan-scope
    counters (commits_scanned, dangling_commits_found, patch_commits_scanned)
    so callers (main.py, the report footer) can show real scope info
    instead of just a bare findings list. Optional and backward-compatible —
    existing callers that don't pass this get unchanged behavior.
    """
    repo = _open_repo(repo_path)
    origin = str(repo_path)

    findings: list[RawFinding] = []

    if since_ref:
        range_findings = list(scan_commits_in_range(repo, origin, since_ref))
        findings.extend(range_findings)
        if stats is not None:
            try:
                commits_in_range = len(list(repo.iter_commits(f"{since_ref}..HEAD")))
            except Exception:
                commits_in_range = 0
            stats["commits_scanned"] = commits_in_range
            stats["dangling_commits_found"] = 0  # not checked in incremental mode
            stats["scan_mode"] = f"incremental ({since_ref}..HEAD)"
        return findings

    findings.extend(scan_commit_metadata(repo, origin))

    dangling_findings = list(scan_dangling_commits(repo, origin))
    findings.extend(dangling_findings)
    dangling_count = sum(1 for f in dangling_findings if f.source_type == SourceType.GIT_DANGLING)

    findings.extend(scan_patches(repo, origin, max_commits=max_patch_commits, progress_callback=progress_callback))

    if stats is not None:
        try:
            all_commits = set()
            for ref in repo.refs:
                try:
                    all_commits.update(c.hexsha for c in repo.iter_commits(ref, max_count=None))
                except Exception:
                    continue
            stats["commits_scanned"] = len(all_commits)
        except Exception:
            stats["commits_scanned"] = 0
        stats["dangling_commits_found"] = dangling_count
        stats["scan_mode"] = "full history"

    return findings
