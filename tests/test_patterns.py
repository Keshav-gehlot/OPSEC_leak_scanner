from opsec_scanner.analysis.patterns import scan_findings, load_rules, Allowlist
from opsec_scanner.models import RawFinding, SourceType


def _finding(text, origin="test.txt"):
    return RawFinding(source_type=SourceType.GIT_PATCH, raw_text=text, origin=origin)


def test_aws_key_detected():
    findings = [_finding("aws_key=AKIAIOSFODNN7EXAMPLE")]
    matches = scan_findings(findings, load_rules(), allowlist=Allowlist())
    assert any(m.rule_id == "aws_access_key" for m in matches)


def test_github_pat_detected():
    findings = [_finding("token: ghp_" + "a" * 36)]
    matches = scan_findings(findings, load_rules(), allowlist=Allowlist())
    assert any(m.rule_id == "github_pat" for m in matches)


def test_low_entropy_placeholder_not_flagged_as_credential():
    # "password=hunter2" is exactly the placeholder case the entropy
    # gate exists to filter out of the generic key=value rule.
    findings = [_finding("password=hunter2")]
    matches = scan_findings(findings, load_rules(), allowlist=Allowlist())
    assert not any(m.rule_id == "generic_api_key_assignment" for m in matches)


def test_underscore_prefixed_var_still_matches():
    # Regression test for the \b boundary bug: DB_PASSWORD=<random> must
    # still match despite the leading underscore. Value needs to be long
    # enough to clear the entropy gate (see calibration note in entropy.py).
    findings = [_finding("DB_PASSWORD=xK9mZ2pQ7wRaB3tL8vN4cF6hJ2kM9")]
    matches = scan_findings(findings, load_rules(), allowlist=Allowlist())
    assert any(m.rule_id == "generic_api_key_assignment" for m in matches)


def test_allowlisted_pattern_suppressed():
    findings = [_finding("AKIAIOSFODNN7EXAMPLE")]
    allowlist = Allowlist(ignore_patterns=["AKIAIOSFODNN7EXAMPLE"])
    matches = scan_findings(findings, load_rules(), allowlist=allowlist)
    assert len(matches) == 0


def test_allowlisted_path_suppressed():
    findings = [_finding("aws_key=AKIAIOSFODNN7EXAMPLE", origin="/repo/node_modules/pkg/file.js")]
    allowlist = Allowlist(ignore_paths=["/node_modules/"])
    matches = scan_findings(findings, load_rules(), allowlist=allowlist)
    assert len(matches) == 0


def test_internal_ip_detected():
    findings = [_finding("connect to 10.0.5.23 for staging")]
    matches = scan_findings(findings, load_rules(), allowlist=Allowlist())
    assert any(m.rule_id == "internal_ip_range" for m in matches)


def test_public_ip_not_flagged_as_internal():
    findings = [_finding("connect to 8.8.8.8 for DNS")]
    matches = scan_findings(findings, load_rules(), allowlist=Allowlist())
    assert not any(m.rule_id == "internal_ip_range" for m in matches)
