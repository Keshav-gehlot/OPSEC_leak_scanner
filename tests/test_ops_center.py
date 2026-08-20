from html.parser import HTMLParser

from opsec_scanner.output.history_store import save_snapshot
from opsec_scanner.output.ops_center import render_ops_center
from opsec_scanner.analysis.patterns import ScannedMatch
from opsec_scanner.scoring.risk_engine import score_findings
from opsec_scanner.config import TargetProfile
from opsec_scanner.models import RawFinding, SourceType


class _StrictParser(HTMLParser):
    void_elements = {"meta", "link", "br", "img", "input", "hr"}

    def __init__(self):
        super().__init__()
        self.stack = []

    def handle_starttag(self, tag, attrs):
        if tag not in self.void_elements:
            self.stack.append(tag)

    def handle_endtag(self, tag):
        assert self.stack and self.stack[-1] == tag, f"mismatched closing tag </{tag}>"
        self.stack.pop()


def _scored(secret, origin, profile=None):
    profile = profile or TargetProfile(name="Test")
    finding = RawFinding(source_type=SourceType.GIT_PATCH, raw_text=secret, origin=origin)
    match = ScannedMatch(finding=finding, rule_id="aws_access_key", category="credentials", base_severity=9.5, matched_text=secret)
    return score_findings([match], profile)


def test_ops_center_with_no_history_shows_empty_state(tmp_path):
    output = tmp_path / "ops.html"
    render_ops_center(tmp_path / "no_history", output)
    html = output.read_text(encoding="utf-8")
    assert "NO SCAN HISTORY" in html

    parser = _StrictParser()
    parser.feed(html)
    assert parser.stack == []


def test_ops_center_renders_valid_html_with_history(tmp_path):
    history_dir = tmp_path / "history"
    save_snapshot(_scored("AKIATEST000000000001", "a.py"), "repo-a", history_dir=history_dir)

    output = tmp_path / "ops.html"
    render_ops_center(history_dir, output)
    html = output.read_text(encoding="utf-8")

    assert "repo-a" in html
    parser = _StrictParser()
    parser.feed(html)
    assert parser.stack == []


def test_ops_center_groups_by_target(tmp_path):
    history_dir = tmp_path / "history"
    save_snapshot(_scored("AKIAA00000000000000A", "a.py"), "repo-a", history_dir=history_dir)
    save_snapshot(_scored("AKIAB00000000000000B", "b.py"), "repo-b", history_dir=history_dir)

    output = tmp_path / "ops.html"
    render_ops_center(history_dir, output)
    html = output.read_text(encoding="utf-8")

    assert "repo-a" in html
    assert "repo-b" in html
    assert "Targets monitored <strong>2</strong>" in html


def test_ops_center_shows_new_finding_diff(tmp_path):
    history_dir = tmp_path / "history"
    save_snapshot(_scored("AKIAOLD0000000000001", "a.py"), "repo-a", history_dir=history_dir)
    save_snapshot(_scored("AKIANEW0000000000002", "b.py"), "repo-a", history_dir=history_dir)

    output = tmp_path / "ops.html"
    render_ops_center(history_dir, output)
    html = output.read_text(encoding="utf-8")

    assert "+1 new" in html


def test_ops_center_escapes_target_label(tmp_path):
    history_dir = tmp_path / "history"
    save_snapshot(_scored("AKIATEST000000000001", "a.py"), "<script>alert(1)</script>", history_dir=history_dir)

    output = tmp_path / "ops.html"
    render_ops_center(history_dir, output)
    html = output.read_text(encoding="utf-8")

    assert "<script>alert(1)</script>" not in html
    assert "&lt;script&gt;" in html
