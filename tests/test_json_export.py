import json

from opsec_scanner.output.json_export import export_json
from opsec_scanner.analysis.patterns import ScannedMatch
from opsec_scanner.scoring.risk_engine import score_findings
from opsec_scanner.config import TargetProfile
from opsec_scanner.models import RawFinding, SourceType


def _scored_with_secret(secret_text="AKIAIOSFODNN7EXAMPLE"):
    profile = TargetProfile(name="Test")
    finding = RawFinding(source_type=SourceType.GIT_PATCH, raw_text=secret_text, origin="repo/file.py")
    match = ScannedMatch(finding=finding, rule_id="aws_access_key", category="credentials", base_severity=9.5, matched_text=secret_text)
    return score_findings([match], profile)


def test_json_redacts_by_default(tmp_path):
    secret = "AKIAIOSFODNN7EXAMPLE"
    scored = _scored_with_secret(secret)
    output = tmp_path / "report.json"
    export_json(scored, output)  # reveal defaults to False

    raw = output.read_text()
    assert secret not in raw

    data = json.loads(raw)
    assert data["redacted"] is True
    assert data["findings"][0]["matched_text"] != secret
    assert data["findings"][0]["matched_text_length"] == len(secret)


def test_json_reveals_when_opted_in(tmp_path):
    secret = "AKIAIOSFODNN7EXAMPLE"
    scored = _scored_with_secret(secret)
    output = tmp_path / "report.json"
    export_json(scored, output, reveal=True)

    data = json.loads(output.read_text())
    assert data["redacted"] is False
    assert data["findings"][0]["matched_text"] == secret


def test_json_handles_empty_findings(tmp_path):
    output = tmp_path / "report_empty.json"
    export_json([], output)
    data = json.loads(output.read_text())
    assert data["total_findings"] == 0
    assert data["findings"] == []
