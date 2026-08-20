"""
Scan history store.

A SOC's defining trait isn't any single alert — it's continuous
monitoring with a history, so trends and new-vs-resolved findings are
visible over time. Everything built so far was one-shot: run a scan,
get a report, done. This module is what turns repeated runs into a
history the Ops Center dashboard can actually show trends from.

Storage is deliberately simple: one JSON file per snapshot in a local
directory (default ./.opsec-scan/history/), no database, no server —
consistent with the tool's local-first design. A snapshot is a summary
of one scan (counts by risk label, per-finding fingerprints, timestamp,
target label) — not the full finding detail, which stays in the
regular HTML/JSON/PDF/SARIF exports for that run.
"""

from __future__ import annotations

import hashlib
import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

from opsec_scanner.scoring.risk_engine import ScoredFinding

DEFAULT_HISTORY_DIR = Path(".opsec-scan") / "history"


def _finding_fingerprint(s: ScoredFinding) -> str:
    """
    Stable identifier for a finding across scans, so the Ops Center can
    tell "still open" from "new" from "resolved" — based on rule + origin
    + matched text, not on anything that changes run to run (like the
    exact risk score, which can shift slightly with rule/weight tuning).
    """
    seed = f"{s.match.rule_id}|{s.match.finding.origin}|{s.match.matched_text}"
    return hashlib.sha1(seed.encode()).hexdigest()[:12]


def save_snapshot(
    scored: list[ScoredFinding],
    target_label: str,
    history_dir: Path | str | None = None,
) -> Path:
    """
    Appends one scan's summary to the history store. Returns the path
    of the snapshot file written.
    """
    history_dir = Path(history_dir) if history_dir else DEFAULT_HISTORY_DIR
    history_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now(timezone.utc)
    label_counts = Counter(s.risk_label for s in scored)

    snapshot = {
        "timestamp": timestamp.isoformat(),
        "target_label": target_label,
        "total_findings": len(scored),
        "counts_by_label": {
            "CRITICAL": label_counts.get("CRITICAL", 0),
            "HIGH": label_counts.get("HIGH", 0),
            "MEDIUM": label_counts.get("MEDIUM", 0),
            "LOW": label_counts.get("LOW", 0),
        },
        "findings": [
            {
                "fingerprint": _finding_fingerprint(s),
                "rule_id": s.match.rule_id,
                "category": s.match.category,
                "risk_label": s.risk_label,
                "risk_score": s.risk_score,
                "origin": s.match.finding.origin,
            }
            for s in scored
        ],
    }

    # microseconds + a short content hash avoid collisions between
    # snapshots saved within the same second — plain second-resolution
    # timestamps silently overwrote each other when scans ran back to
    # back (e.g. scanning several repos in one CLI invocation).
    content_hash = hashlib.sha1(json.dumps(snapshot, sort_keys=True).encode()).hexdigest()[:8]
    filename = f"{timestamp.strftime('%Y%m%dT%H%M%S%f')}Z_{target_label.replace('/', '_')}_{content_hash}.json"
    snapshot_path = history_dir / filename
    with open(snapshot_path, "w") as f:
        json.dump(snapshot, f, indent=2)

    return snapshot_path


def load_history(history_dir: Path | str | None = None) -> list[dict]:
    """
    Loads all snapshots, sorted oldest to newest. Missing directory
    returns an empty list rather than erroring — a fresh repo with no
    scan history yet is a normal state, not a failure.
    """
    history_dir = Path(history_dir) if history_dir else DEFAULT_HISTORY_DIR
    if not history_dir.exists():
        return []

    snapshots = []
    for path in sorted(history_dir.glob("*.json")):
        try:
            with open(path, "r") as f:
                snapshots.append(json.load(f))
        except (json.JSONDecodeError, OSError):
            continue  # skip corrupt/partial snapshot files rather than failing the whole load

    snapshots.sort(key=lambda s: s.get("timestamp", ""))
    return snapshots


def diff_latest_two(snapshots: list[dict]) -> dict:
    """
    Compares the two most recent snapshots (for the same target_label,
    if mixed targets are present) and returns which findings are new,
    resolved, or still open. This is the "what changed since last scan"
    view that makes repeated scanning worth more than a pile of
    identical-looking reports.
    """
    if len(snapshots) < 2:
        return {"new": [], "resolved": [], "still_open": [], "comparable": False}

    latest = snapshots[-1]
    previous = snapshots[-2]

    latest_fps = {f["fingerprint"]: f for f in latest["findings"]}
    previous_fps = {f["fingerprint"]: f for f in previous["findings"]}

    new_fps = set(latest_fps) - set(previous_fps)
    resolved_fps = set(previous_fps) - set(latest_fps)
    still_open_fps = set(latest_fps) & set(previous_fps)

    return {
        "comparable": True,
        "previous_timestamp": previous["timestamp"],
        "latest_timestamp": latest["timestamp"],
        "new": [latest_fps[fp] for fp in new_fps],
        "resolved": [previous_fps[fp] for fp in resolved_fps],
        "still_open": [latest_fps[fp] for fp in still_open_fps],
    }
