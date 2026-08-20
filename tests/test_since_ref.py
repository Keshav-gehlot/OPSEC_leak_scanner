import subprocess
import pytest


@pytest.fixture
def repo_with_history(tmp_path):
    repo = tmp_path / "repo"
    repo.mkdir()

    def run(*args):
        subprocess.run(["git", *args], cwd=repo, check=True, capture_output=True)

    run("init", "-q")
    run("config", "user.name", "Test")
    run("config", "user.email", "test@example.com")

    (repo / "base.txt").write_text("base\n")
    run("add", "base.txt")
    run("commit", "-q", "-m", "base commit")
    run("tag", "base_marker")

    (repo / "new.txt").write_text("aws_key=AKIANEWSECRETKEY1234\n")
    run("add", "new.txt")
    run("commit", "-q", "-m", "add new secret")

    return repo


def test_since_ref_scopes_to_range_only(repo_with_history):
    from opsec_scanner.engines.git_engine import scan_git_repo

    full = scan_git_repo(repo_with_history)
    incremental = scan_git_repo(repo_with_history, since_ref="base_marker")

    # Full history sees both commits' authors; incremental sees strictly
    # fewer commit-metadata findings since the base commit is excluded.
    assert len(incremental) < len(full)


def test_since_ref_still_finds_new_secret(repo_with_history):
    from opsec_scanner.engines.git_engine import scan_git_repo

    findings = scan_git_repo(repo_with_history, since_ref="base_marker")
    texts = [f.raw_text for f in findings]
    assert any("AKIANEWSECRETKEY1234" in t for t in texts)


def test_stats_dict_populated_in_incremental_mode(repo_with_history):
    from opsec_scanner.engines.git_engine import scan_git_repo

    stats = {}
    scan_git_repo(repo_with_history, since_ref="base_marker", stats=stats)
    assert stats["commits_scanned"] == 1
    assert "incremental" in stats["scan_mode"]


def test_stats_dict_populated_in_full_history_mode(repo_with_history):
    from opsec_scanner.engines.git_engine import scan_git_repo

    stats = {}
    scan_git_repo(repo_with_history, stats=stats)
    assert stats["commits_scanned"] == 2
    assert stats["scan_mode"] == "full history"


def test_invalid_since_ref_raises_clear_error(repo_with_history):
    from opsec_scanner.engines.git_engine import scan_git_repo

    with pytest.raises(ValueError):
        scan_git_repo(repo_with_history, since_ref="this_ref_does_not_exist")
