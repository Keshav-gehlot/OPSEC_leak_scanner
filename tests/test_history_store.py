from opsec_scanner.output.history_store import save_snapshot, load_history, diff_latest_two
from opsec_scanner.analysis.patterns import ScannedMatch
from opsec_scanner.scoring.risk_engine import score_findings
from opsec_scanner.config import TargetProfile
from opsec_scanner.models import RawFinding, SourceType


def _scored(secret_text="AKIAIOSFODNN7EXAMPLE", origin="repo/file.py"):
    profile = TargetProfile(name="Test")
    finding = RawFinding(source_type=SourceType.GIT_PATCH, raw_text=secret_text, origin=origin)
    match = ScannedMatch(finding=finding, rule_id="aws_access_key", category="credentials", base_severity=9.5, matched_text=secret_text)
    return score_findings([match], profile)


def test_save_and_load_snapshot(tmp_path):
    scored = _scored()
    save_snapshot(scored, "test-repo", history_dir=tmp_path)

    history = load_history(tmp_path)
    assert len(history) == 1
    assert history[0]["target_label"] == "test-repo"
    assert history[0]["total_findings"] == 1


def test_missing_history_dir_returns_empty_list(tmp_path):
    assert load_history(tmp_path / "does_not_exist") == []


def test_snapshots_sorted_oldest_to_newest(tmp_path):
    save_snapshot(_scored(), "repo-a", history_dir=tmp_path)
    save_snapshot(_scored(), "repo-b", history_dir=tmp_path)

    history = load_history(tmp_path)
    assert len(history) == 2
    assert history[0]["timestamp"] <= history[1]["timestamp"]


def test_corrupt_snapshot_file_is_skipped_not_fatal(tmp_path):
    tmp_path.mkdir(exist_ok=True)
    (tmp_path / "corrupt.json").write_text("{not valid json")
    save_snapshot(_scored(), "repo-a", history_dir=tmp_path)

    history = load_history(tmp_path)
    assert len(history) == 1  # corrupt file skipped, valid one loaded


def test_diff_with_fewer_than_two_snapshots_not_comparable(tmp_path):
    save_snapshot(_scored(), "repo-a", history_dir=tmp_path)
    history = load_history(tmp_path)
    diff = diff_latest_two(history)
    assert diff["comparable"] is False


def test_diff_detects_new_finding(tmp_path):
    save_snapshot(_scored(secret_text="AKIAFIRST00000000000", origin="a.py"), "repo", history_dir=tmp_path)
    save_snapshot(_scored(secret_text="AKIASECOND0000000000", origin="b.py"), "repo", history_dir=tmp_path)

    history = load_history(tmp_path)
    diff = diff_latest_two(history)
    assert diff["comparable"] is True
    assert len(diff["new"]) == 1
    assert len(diff["resolved"]) == 1  # first finding no longer present in latest scan
    assert len(diff["still_open"]) == 0


def test_diff_detects_still_open_finding(tmp_path):
    # Same finding present in both scans (same rule + origin + matched text)
    scored1 = _scored(secret_text="AKIASAME000000000000", origin="same.py")
    save_snapshot(scored1, "repo", history_dir=tmp_path)
    scored2 = _scored(secret_text="AKIASAME000000000000", origin="same.py")
    save_snapshot(scored2, "repo", history_dir=tmp_path)

    history = load_history(tmp_path)
    diff = diff_latest_two(history)
    assert len(diff["still_open"]) == 1
    assert len(diff["new"]) == 0
    assert len(diff["resolved"]) == 0
