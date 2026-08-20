from opsec_scanner.config import TargetProfile
from opsec_scanner.analysis.patterns import ScannedMatch
from opsec_scanner.scoring.risk_engine import score_match, deduplicate_findings, ExposureLevel, score_findings
from opsec_scanner.models import RawFinding, SourceType


def _match(text, rule_id="aws_access_key", severity=9.5, origin="repo"):
    finding = RawFinding(source_type=SourceType.GIT_PATCH, raw_text=text, origin=origin)
    return ScannedMatch(finding=finding, rule_id=rule_id, category="credentials", base_severity=severity, matched_text=text)


def test_score_clamped_to_ten():
    profile = TargetProfile(name="X", aliases=["x"])
    m = _match("x")  # will direct-match alias "x"... use safer text
    m2 = _match("critical secret", severity=9.5)
    scored = score_match(m2, profile, exposure_override=ExposureLevel.PUBLIC_REACHABLE)
    assert scored.risk_score <= 10.0


def test_generic_match_scores_lower_than_identity_correlated():
    profile = TargetProfile(name="John Doe", emails=["john.doe@gmail.com"])
    correlated = _match("john.doe@gmail.com", rule_id="personal_email_domain", severity=4.5)
    generic = _match("someone.else@gmail.com", rule_id="personal_email_domain", severity=4.5)

    scored_correlated = score_match(correlated, profile)
    scored_generic = score_match(generic, profile)

    assert scored_correlated.risk_score > scored_generic.risk_score


def test_dangling_commit_exposure_inferred_as_hidden():
    finding = RawFinding(source_type=SourceType.GIT_DANGLING, raw_text="secret", origin="repo")
    match = ScannedMatch(finding=finding, rule_id="aws_access_key", category="credentials", base_severity=9.5, matched_text="secret")
    profile = TargetProfile(name="X")
    scored = score_match(match, profile)
    assert scored.exposure_level == ExposureLevel.ARCHIVED_OR_HIDDEN


def test_deduplication_collapses_repeated_findings():
    profile = TargetProfile(name="X")
    matches = [_match("AKIAIOSFODNN7EXAMPLE") for _ in range(5)]
    scored = score_findings(matches, profile)
    deduped = deduplicate_findings(scored)
    assert len(deduped) == 1
    assert deduped[0].match.finding.metadata["occurrence_count"] == 5


def test_public_repo_override_forces_full_exposure_weight():
    profile = TargetProfile(name="X")
    match = _match("AKIAIOSFODNN7EXAMPLE")
    scored = score_match(match, profile, exposure_override=ExposureLevel.PUBLIC_REACHABLE)
    assert scored.exposure_level == ExposureLevel.PUBLIC_REACHABLE
