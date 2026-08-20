import json

from opsec_scanner.output.sarif_export import export_sarif
from opsec_scanner.analysis.patterns import ScannedMatch
from opsec_scanner.scoring.risk_engine import score_findings
from opsec_scanner.config import TargetProfile
from opsec_scanner.models import RawFinding, SourceType


def _scored(secret_text="AKIAIOSFODNN7EXAMPLE", severity=9.5):
    profile = TargetProfile(name="Test")
    finding = RawFinding(source_type=SourceType.GIT_PATCH, raw_text=secret_text, origin="repo/file.py")
    match = ScannedMatch(finding=finding, rule_id="aws_access_key", category="credentials", base_severity=severity, matched_text=secret_text)
    return score_findings([match], profile)


def test_sarif_is_valid_json_with_required_top_level_keys(tmp_path):
    scored = _scored()
    output = tmp_path / "report.sarif"
    export_sarif(scored, output)

    data = json.loads(output.read_text())
    assert data["version"] == "2.1.0"
    assert "runs" in data
    assert len(data["runs"]) == 1
    assert "results" in data["runs"][0]
    assert "rules" in data["runs"][0]["tool"]["driver"]


def test_sarif_redacts_by_default(tmp_path):
    secret = "AKIAIOSFODNN7EXAMPLE"
    scored = _scored(secret)
    output = tmp_path / "report.sarif"
    export_sarif(scored, output)

    raw = output.read_text()
    assert secret not in raw


def test_sarif_reveals_when_opted_in(tmp_path):
    secret = "AKIAIOSFODNN7EXAMPLE"
    scored = _scored(secret)
    output = tmp_path / "report.sarif"
    export_sarif(scored, output, reveal=True)

    raw = output.read_text()
    assert secret in raw


def test_sarif_critical_maps_to_error_level(tmp_path):
    from opsec_scanner.scoring.risk_engine import ScoredFinding, ExposureLevel

    finding = RawFinding(source_type=SourceType.GIT_PATCH, raw_text="AKIAIOSFODNN7EXAMPLE", origin="repo/file.py")
    match = ScannedMatch(finding=finding, rule_id="aws_access_key", category="credentials", base_severity=9.5, matched_text="AKIAIOSFODNN7EXAMPLE")
    scored = [ScoredFinding(
        match=match, risk_score=9.5, risk_label="CRITICAL",
        exposure_level=ExposureLevel.PUBLIC_REACHABLE, identity_confidence=1.0, identity_reason="test",
    )]

    output = tmp_path / "report.sarif"
    export_sarif(scored, output)

    data = json.loads(output.read_text())
    assert data["runs"][0]["results"][0]["level"] == "error"


def test_sarif_dedupes_rule_declarations_across_multiple_findings(tmp_path):
    profile = TargetProfile(name="Test")
    matches = []
    for i in range(3):
        finding = RawFinding(source_type=SourceType.GIT_PATCH, raw_text=f"AKIA{i}", origin=f"file{i}.py")
        matches.append(ScannedMatch(finding=finding, rule_id="aws_access_key", category="credentials", base_severity=9.5, matched_text=f"AKIA{i}"))
    scored = score_findings(matches, profile)

    output = tmp_path / "report.sarif"
    export_sarif(scored, output)
    data = json.loads(output.read_text())

    assert len(data["runs"][0]["tool"]["driver"]["rules"]) == 1  # one rule declared, not three
    assert len(data["runs"][0]["results"]) == 3  # but three results
