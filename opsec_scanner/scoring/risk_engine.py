"""
Risk Correlation & Scoring Engine.

Final formula: risk_score = S_base * C_target * V_exposure

  S_base       — base severity of the finding category (from patterns.yaml)
  C_target     — identity correlation multiplier (identity_graph.py)
  V_exposure   — reach factor: how publicly exposed is this finding

V_exposure defaults are deliberately simple and configurable rather than
hardcoded, since "reach" depends on context this tool doesn't always know
(e.g. whether a repo is actually public vs. private-but-shared). Prompt
#9 test fixtures should be used to calibrate S_base weights in
rules/patterns.yaml against real output before trusting these scores
at face value — see the note on the risk formula needing calibration
data, not just designed values.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from opsec_scanner.analysis.identity_graph import match_identity
from opsec_scanner.analysis.patterns import ScannedMatch
from opsec_scanner.config import TargetProfile
from opsec_scanner.models import SourceType


class ExposureLevel(str, Enum):
    PUBLIC_REACHABLE = "public_reachable"       # public repo/HEAD, public web content
    ARCHIVED_OR_HIDDEN = "archived_or_hidden"    # dangling/orphaned commit, deleted-but-recoverable
    LOCAL_ONLY = "local_only"                    # scanned from a local path with no known public exposure


EXPOSURE_WEIGHTS: dict[ExposureLevel, float] = {
    ExposureLevel.PUBLIC_REACHABLE: 1.0,
    ExposureLevel.ARCHIVED_OR_HIDDEN: 0.6,
    # NOTE on calibration: this was originally 0.4 per the initial design,
    # but testing against a real leak (DB connection string w/ embedded
    # admin credentials + direct identity match) showed it dragging a
    # 9.0-severity finding down to MEDIUM. For a *self-audit* tool, the
    # entire point is catching leaks before they're public — discounting
    # local findings that hard defeats the purpose. Raised to 0.75.
    # Use --public-repo on the CLI to force PUBLIC_REACHABLE (1.0x) when
    # scanning a target that's already known to be publicly hosted.
    ExposureLevel.LOCAL_ONLY: 0.75,
}

# Risk score bands for the human-readable label shown in the dashboard.
RISK_BANDS = (
    (9.0, "CRITICAL"),
    (6.5, "HIGH"),
    (4.0, "MEDIUM"),
    (0.0, "LOW"),
)


@dataclass
class ScoredFinding:
    match: ScannedMatch
    risk_score: float
    risk_label: str
    exposure_level: ExposureLevel
    identity_confidence: float
    identity_reason: str


def _infer_exposure(match: ScannedMatch) -> ExposureLevel:
    """
    Heuristic exposure inference from the finding's source_type/context.
    Dangling git commits are the "archived/hidden" case from the original
    design (deleted branch but object still in .git). Everything else
    from a local repo/media scan defaults to LOCAL_ONLY until this tool
    is wired up to know whether the repo/dir is actually publicly hosted
    (a --public-repo CLI flag is the natural v1.1 addition here).
    """
    if match.finding.source_type == SourceType.GIT_DANGLING:
        return ExposureLevel.ARCHIVED_OR_HIDDEN
    return ExposureLevel.LOCAL_ONLY


def _label_for_score(score: float) -> str:
    for threshold, label in RISK_BANDS:
        if score >= threshold:
            return label
    return "LOW"


def score_match(match: ScannedMatch, profile: TargetProfile, exposure_override: ExposureLevel | None = None) -> ScoredFinding:
    identity_result = match_identity(match.matched_text, profile)
    exposure = exposure_override or _infer_exposure(match)
    v_exposure = EXPOSURE_WEIGHTS[exposure]

    risk_score = match.base_severity * identity_result.confidence_multiplier * v_exposure
    # Clamp to a 0-10 display scale — the raw product can exceed 10 when
    # S_base is already high (9.5) and C_target boosts it (x1.5).
    risk_score = min(risk_score, 10.0)

    return ScoredFinding(
        match=match,
        risk_score=round(risk_score, 2),
        risk_label=_label_for_score(risk_score),
        exposure_level=exposure,
        identity_confidence=identity_result.confidence_multiplier,
        identity_reason=identity_result.reason,
    )


def score_findings(
    matches: list[ScannedMatch],
    profile: TargetProfile,
    exposure_override: ExposureLevel | None = None,
) -> list[ScoredFinding]:
    """
    Scores every match, then sorts descending by risk_score so the
    dashboard/report shows the most critical findings first.
    """
    scored = [score_match(m, profile, exposure_override) for m in matches]
    scored.sort(key=lambda s: s.risk_score, reverse=True)
    return scored


def deduplicate_findings(scored: list[ScoredFinding]) -> list[ScoredFinding]:
    """
    Collapses findings that are the same (rule_id + matched_text) seen
    across multiple commits/files down to a single entry, keeping the
    highest-scored instance and noting the total occurrence count.
    This is the 'Deduplication & Canary Validation' step from the design —
    without it, a secret committed once and touched by 10 later commits
    would show up as 10 separate critical findings.
    """
    best_by_key: dict[tuple[str, str], ScoredFinding] = {}
    counts: dict[tuple[str, str], int] = {}

    for s in scored:
        key = (s.match.rule_id, s.match.matched_text)
        counts[key] = counts.get(key, 0) + 1
        if key not in best_by_key or s.risk_score > best_by_key[key].risk_score:
            best_by_key[key] = s

    deduped = []
    for key, s in best_by_key.items():
        s.match.finding.metadata["occurrence_count"] = counts[key]
        deduped.append(s)

    deduped.sort(key=lambda s: s.risk_score, reverse=True)
    return deduped
