import subprocess
import sys
import textwrap
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent


def _run_cli(args, cwd=None):
    return subprocess.run(
        [sys.executable, "-m", "opsec_scanner.main"] + args,
        cwd=cwd or REPO_ROOT,
        capture_output=True,
        text=True,
        timeout=60,
    )


def _make_leak_repo(tmp_path):
    repo = tmp_path / "repo"
    repo.mkdir()

    def run(*a):
        subprocess.run(["git", *a], cwd=repo, check=True, capture_output=True)

    run("init", "-q")
    run("config", "user.name", "Test")
    run("config", "user.email", "test@example.com")
    (repo / "secret.txt").write_text("postgres://admin:Password123@db.internal.co:5432/main\n")
    run("add", "secret.txt")
    run("commit", "-q", "-m", "add secret")
    return repo


def _make_profile(tmp_path):
    profile = tmp_path / "profile.yaml"
    profile.write_text(textwrap.dedent("""
        name: Test User
        aliases: []
        emails: []
        domains: [internal.co]
        github_handles: []
    """))
    return profile


def test_cli_exits_zero_with_fail_on_none(tmp_path):
    repo = _make_leak_repo(tmp_path)
    profile = _make_profile(tmp_path)
    result = _run_cli([
        "--repo", str(repo), "--profile", str(profile),
        "--output", str(tmp_path / "report.html"),
        "--fail-on", "NONE", "--no-progress", "--public-repo",
    ])
    assert result.returncode == 0


def test_cli_exits_one_when_fail_on_threshold_met(tmp_path):
    repo = _make_leak_repo(tmp_path)
    profile = _make_profile(tmp_path)
    result = _run_cli([
        "--repo", str(repo), "--profile", str(profile),
        "--output", str(tmp_path / "report.html"),
        "--fail-on", "CRITICAL", "--no-progress", "--public-repo",
    ])
    assert result.returncode == 1
    assert "FAILING" in result.stdout


def test_config_file_sets_fail_on_default(tmp_path):
    repo = _make_leak_repo(tmp_path)
    profile = _make_profile(tmp_path)
    config = tmp_path / "opsec-scan.yaml"
    config.write_text("fail_on: CRITICAL\npublic_repo: true\n")

    result = _run_cli([
        "--repo", str(repo), "--profile", str(profile),
        "--output", str(tmp_path / "report.html"),
        "--config", str(config), "--no-progress",
    ])
    assert result.returncode == 1


def test_explicit_cli_flag_overrides_config_file(tmp_path):
    repo = _make_leak_repo(tmp_path)
    profile = _make_profile(tmp_path)
    config = tmp_path / "opsec-scan.yaml"
    config.write_text("fail_on: CRITICAL\npublic_repo: true\n")

    result = _run_cli([
        "--repo", str(repo), "--profile", str(profile),
        "--output", str(tmp_path / "report.html"),
        "--config", str(config), "--fail-on", "NONE", "--no-progress",
    ])
    assert result.returncode == 0


def test_cli_produces_all_export_formats_in_one_run(tmp_path):
    repo = _make_leak_repo(tmp_path)
    profile = _make_profile(tmp_path)
    result = _run_cli([
        "--repo", str(repo), "--profile", str(profile),
        "--output", str(tmp_path / "report.html"),
        "--json-output", str(tmp_path / "report.json"),
        "--sarif-output", str(tmp_path / "report.sarif"),
        "--pdf-output", str(tmp_path / "report.pdf"),
        "--no-progress",
    ])
    assert result.returncode == 0
    assert (tmp_path / "report.html").exists()
    assert (tmp_path / "report.json").exists()
    assert (tmp_path / "report.sarif").exists()
    assert (tmp_path / "report.pdf").exists()
