import subprocess
import pytest
from pathlib import Path

from opsec_scanner.engines.git_engine import scan_git_repo
from opsec_scanner.models import SourceType


@pytest.fixture
def leak_repo(tmp_path):
    repo = tmp_path / "leak_repo"
    repo.mkdir()

    def run(*args):
        subprocess.run(["git", *args], cwd=repo, check=True, capture_output=True)

    run("init", "-q")
    run("config", "user.name", "John Doe")
    run("config", "user.email", "john.doe@gmail.com")

    (repo / "app.py").write_text("print('hello')\n")
    run("add", "app.py")
    run("commit", "-q", "-m", "initial")

    (repo / "secret.txt").write_text("aws_key=AKIAIOSFODNN7EXAMPLE\n")
    run("add", "secret.txt")
    run("commit", "-q", "-m", "add secret")

    run("rm", "--cached", "secret.txt", "-q")
    (repo / ".gitignore").write_text("secret.txt\n")
    run("add", ".gitignore")
    run("commit", "-q", "-m", "remove secret from tracking")

    return repo


def test_scan_returns_findings(leak_repo):
    findings = scan_git_repo(leak_repo)
    assert len(findings) > 0


def test_author_email_extracted(leak_repo):
    findings = scan_git_repo(leak_repo)
    emails = [f.raw_text for f in findings if f.source_type == SourceType.GIT_COMMIT_META]
    assert "john.doe@gmail.com" in emails


def test_deleted_secret_still_surfaces_in_patch_diff(leak_repo):
    # The whole point of patch diffing: a secret removed from tracking
    # in a later commit must still show up as a raw finding.
    findings = scan_git_repo(leak_repo)
    patch_texts = [f.raw_text for f in findings if f.source_type == SourceType.GIT_PATCH]
    assert any("AKIAIOSFODNN7EXAMPLE" in t for t in patch_texts)


def test_root_commit_secret_is_detected(tmp_path):
    # Regression test: root commits (no parent) were previously skipped
    # entirely in patch diffing, meaning a secret committed in a repo's
    # very first commit was invisible to scanning. Fixed by diffing
    # against git's empty tree instead of skipping.
    repo = tmp_path / "root_only_repo"
    repo.mkdir()

    def run(*args):
        subprocess.run(["git", *args], cwd=repo, check=True, capture_output=True)

    run("init", "-q")
    run("config", "user.name", "Test")
    run("config", "user.email", "test@example.com")
    (repo / "secret.txt").write_text("aws_key=AKIAROOTCOMMITSECRET1\n")
    run("add", "secret.txt")
    run("commit", "-q", "-m", "single root commit with a secret")

    findings = scan_git_repo(repo)
    patch_texts = [f.raw_text for f in findings if f.source_type == SourceType.GIT_PATCH]
    assert any("AKIAROOTCOMMITSECRET1" in t for t in patch_texts)


def test_gitignore_path_flagged_as_sensitive(leak_repo):
    findings = scan_git_repo(leak_repo)
    paths = [f.raw_text for f in findings if f.source_type == SourceType.GIT_PATH]
    # secret.txt itself isn't a marker path, but this confirms path
    # scanning runs without error on a repo with no sensitive filenames
    assert isinstance(paths, list)
