"""
Project config file loader.

Rather than a growing pile of CLI flags to memorize every run, a project
can drop an opsec-scan.yaml at its root (or point --config at one) and
those become the defaults. Any flag actually passed on the command line
still wins — this works by feeding the loaded config into
argparse.set_defaults() *before* parsing, so argparse's own "explicit
flag beats default" behavior does the override logic for free rather
than needing a manual merge step here.
"""

from __future__ import annotations

from pathlib import Path

import yaml

DEFAULT_CONFIG_PATH = Path("opsec-scan.yaml")

# Maps config file keys -> argparse dest names, only where they differ
# or need a value transform (e.g. max_patch_commits: 0 -> None).
_KEY_ALIASES = {
    "reveal_secrets": ("reveal_in_pdf", "reveal_in_json"),  # one config key, two flags
}


def load_config(path: Path | str | None = None) -> dict:
    """
    Returns a dict suitable for argparse.set_defaults(**config).
    Missing file is not an error — config is entirely optional, this
    just means "no overrides, use built-in defaults."
    """
    p = Path(path) if path else DEFAULT_CONFIG_PATH
    if not p.exists():
        return {}

    with open(p, "r", encoding="utf-8") as f:
        raw = yaml.safe_load(f) or {}

    defaults: dict = {}

    if "entropy_threshold" in raw:
        defaults["entropy_threshold"] = float(raw["entropy_threshold"])
    if "max_patch_commits" in raw:
        defaults["max_patch_commits"] = int(raw["max_patch_commits"])
    if "public_repo" in raw:
        defaults["public_repo"] = bool(raw["public_repo"])
    if "fail_on" in raw:
        defaults["fail_on"] = str(raw["fail_on"]).upper()
    if "profile" in raw:
        defaults["profile"] = str(raw["profile"])
    if "reveal_secrets" in raw:
        val = bool(raw["reveal_secrets"])
        defaults["reveal_in_pdf"] = val
        defaults["reveal_in_json"] = val

    return defaults
