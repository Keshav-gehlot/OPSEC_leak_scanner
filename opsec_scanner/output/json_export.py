"""
JSON export of scored findings.

Redaction default matches pdf_export.py: a JSON file is exactly as
shareable/committable/archivable as a PDF — more so, since it's the
natural format for a CI artifacts folder or a Slack attachment — so it
gets the same safe-by-default treatment. reveal=True is opt-in only,
same as --reveal-in-pdf.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from opsec_scanner.scoring.risk_engine import ScoredFinding

_REDACTED_PLACEHOLDER = "█" * 18


def export_json(scored: list[ScoredFinding], output_path: str | Path, reveal: bool = False) -> None:
    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "redacted": not reveal,
        "total_findings": len(scored),
        "findings": [
            {
                "risk_score": s.risk_score,
                "risk_label": s.risk_label,
                "rule_id": s.match.rule_id,
                "category": s.match.category,
                "matched_text": s.match.matched_text if reveal else _REDACTED_PLACEHOLDER,
                "matched_text_length": len(s.match.matched_text),
                "base_severity": s.match.base_severity,
                "entropy_score": s.match.entropy_score,
                "identity_confidence": s.identity_confidence,
                "identity_reason": s.identity_reason,
                "exposure_level": s.exposure_level.value,
                "source_type": s.match.finding.source_type.value,
                "origin": s.match.finding.origin,
                "context": s.match.finding.context,
                "occurrence_count": s.match.finding.metadata.get("occurrence_count", 1),
                "metadata": s.match.finding.metadata,
            }
            for s in scored
        ],
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, default=str)
