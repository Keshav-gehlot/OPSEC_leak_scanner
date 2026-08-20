import yaml

from opsec_scanner.config_loader import load_config


def test_missing_config_returns_empty_dict(tmp_path):
    assert load_config(tmp_path / "nonexistent.yaml") == {}


def test_loads_basic_values(tmp_path):
    p = tmp_path / "opsec-scan.yaml"
    p.write_text(yaml.dump({"entropy_threshold": 4.0, "max_patch_commits": 1000, "public_repo": True}))

    config = load_config(p)
    assert config["entropy_threshold"] == 4.0
    assert config["max_patch_commits"] == 1000
    assert config["public_repo"] is True


def test_fail_on_normalized_to_uppercase(tmp_path):
    p = tmp_path / "opsec-scan.yaml"
    p.write_text(yaml.dump({"fail_on": "critical"}))

    config = load_config(p)
    assert config["fail_on"] == "CRITICAL"


def test_reveal_secrets_expands_to_both_flags(tmp_path):
    p = tmp_path / "opsec-scan.yaml"
    p.write_text(yaml.dump({"reveal_secrets": True}))

    config = load_config(p)
    assert config["reveal_in_pdf"] is True
    assert config["reveal_in_json"] is True


def test_partial_config_only_sets_present_keys(tmp_path):
    p = tmp_path / "opsec-scan.yaml"
    p.write_text(yaml.dump({"entropy_threshold": 3.0}))

    config = load_config(p)
    assert config == {"entropy_threshold": 3.0}
