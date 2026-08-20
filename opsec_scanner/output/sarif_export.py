"""
SARIF 2.1.0 export.

SARIF is what GitHub/GitLab natively render inline on pull requests
(Security tab, PR annotations) — this was in the original architecture
diagram ("JSON / SARIF Export") and never actually built; only plain
JSON was. This closes that gap.

Same redaction default as json_export.py and pdf_export.py: SARIF is
exactly the kind of artifact that ends up in a CI logs bucket or a
public PR comment, so secrets are redacted by default.

Spec: https://docs.oasis-open.org/sarif/sarif/v2.1.0/
"""

from __future__ import annotations

import json
from pathlib import Path

from opsec_scanner.scoring.risk_engine import ScoredFinding

_REDACTED_PLACEHOLDER = "█" * 18

# SARIF has no native concept of our four-tier risk label, so map onto
# SARIF's own "level" enum, which GitHub uses to color PR annotations.
_LEVEL_MAP = {
    "CRITICAL": "error",
    "HIGH": "error",
    "MEDIUM": "warning",
    "LOW": "note",
}


def _rule_descriptor(rule_id: str, category: str) -> dict:
    return {
        "id": rule_id,
        "shortDescription": {"text": f"OPSEC finding: {rule_id.replace('_', ' ')}"},
        "properties": {"category": category},
    }


def export_sarif(scored: list[ScoredFinding], output_path: str | Path, reveal: bool = False) -> None:
    rule_ids_seen: dict[str, dict] = {}
    results = []

    for s in scored:
        rule_ids_seen.setdefault(s.match.rule_id, _rule_descriptor(s.match.rule_id, s.match.category))

        matched_text = s.match.matched_text if reveal else _REDACTED_PLACEHOLDER
        message = (
            f"{s.risk_label} ({s.risk_score:.2f}): {matched_text} — {s.identity_reason}"
        )

        results.append(
            {
                "ruleId": s.match.rule_id,
                "level": _LEVEL_MAP.get(s.risk_label, "warning"),
                "message": {"text": message},
                "locations": [
                    {
                        "physicalLocation": {
                            "artifactLocation": {"uri": s.match.finding.origin or "unknown"},
                        }
                    }
                ],
                "properties": {
                    "risk_score": s.risk_score,
                    "category": s.match.category,
                    "exposure_level": s.exposure_level.value,
                    "identity_confidence": s.identity_confidence,
                    "occurrence_count": s.match.finding.metadata.get("occurrence_count", 1),
                },
            }
        )

    sarif = {
        "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
        "version": "2.1.0",
        "runs": [
            {
                "tool": {
                    "driver": {
                        "name": "opsec-leak-scanner",
                        "informationUri": "https://github.com/Keshav-gehlot/opsec-scanner",
                        "version": "0.3.0",
                        "rules": list(rule_ids_seen.values()),
                    }
                },
                "results": results,
            }
        ],
    }

    with open(output_path, "w") as f:
        json.dump(sarif, f, indent=2, default=str)
