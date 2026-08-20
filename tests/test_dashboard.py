from pathlib import Path
from html.parser import HTMLParser

from opsec_scanner.output.dashboard import render_dashboard
from opsec_scanner.analysis.patterns import ScannedMatch
from opsec_scanner.scoring.risk_engine import score_findings
from opsec_scanner.config import TargetProfile
from opsec_scanner.models import RawFinding, SourceType


class _StrictParser(HTMLParser):
    """Fails on malformed tag nesting — catches f-string/template bugs
    that would otherwise only surface as a broken render in a browser."""

    void_elements = {"meta", "link", "br", "img", "input", "hr"}

    def __init__(self):
        super().__init__()
        self.stack = []

    def handle_starttag(self, tag, attrs):
        if tag not in self.void_elements:
            self.stack.append(tag)

    def handle_endtag(self, tag):
        assert self.stack and self.stack[-1] == tag, f"mismatched closing tag </{tag}>, stack was {self.stack}"
        self.stack.pop()


def _sample_scored(profile):
    finding = RawFinding(source_type=SourceType.GIT_PATCH, raw_text="AKIAIOSFODNN7EXAMPLE", origin="repo/secret.txt", context="commit abc123")
    match = ScannedMatch(finding=finding, rule_id="aws_access_key", category="credentials", base_severity=9.5, matched_text="AKIAIOSFODNN7EXAMPLE")
    return score_findings([match], profile)


def test_dashboard_renders_valid_html_with_findings(tmp_path):
    profile = TargetProfile(name="Test")
    scored = _sample_scored(profile)
    output = tmp_path / "report.html"

    render_dashboard(scored, output)

    html = output.read_text(encoding="utf-8")
    assert "<!DOCTYPE html>" in html
    assert "AKIAIOSFODNN7EXAMPLE" in html  # revealed value present (behind <details>)
    assert "█" in html  # redaction bar present

    parser = _StrictParser()
    parser.feed(html)
    assert parser.stack == [], f"unclosed tags: {parser.stack}"


def test_dashboard_renders_clean_record_state(tmp_path):
    output = tmp_path / "report_empty.html"
    render_dashboard([], output)

    html = output.read_text(encoding="utf-8")
    assert "RECORD CLEAN" in html

    parser = _StrictParser()
    parser.feed(html)
    assert parser.stack == []


def test_dashboard_escapes_html_in_matched_text(tmp_path):
    profile = TargetProfile(name="Test")
    finding = RawFinding(
        source_type=SourceType.GIT_PATCH,
        raw_text='<script>alert(1)</script>',
        origin="repo",
        context="test",
    )
    match = ScannedMatch(finding=finding, rule_id="test_rule", category="credentials", base_severity=9.0, matched_text='<script>alert(1)</script>')
    scored = score_findings([match], profile)

    output = tmp_path / "report_xss.html"
    render_dashboard(scored, output)
    html = output.read_text(encoding="utf-8")

    # The raw payload must never appear unescaped — this would be a
    # stored-XSS-in-a-local-file bug if a scanned repo/media file
    # contained a crafted string that got templated straight into the report.
    assert "<script>alert(1)</script>" not in html
    assert "&lt;script&gt;" in html
