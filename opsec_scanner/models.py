"""
Shared data model for raw findings passed between engines and the
analysis/scoring layers. Keeping this as one dataclass means every
engine (git, media, future web crawler) speaks the same language
downstream.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


class SourceType(str, Enum):
    GIT_COMMIT_META = "git_commit_meta"
    GIT_PATCH = "git_patch"
    GIT_DANGLING = "git_dangling_commit"
    GIT_PATH = "git_file_path"
    MEDIA_EXIF = "media_exif"
    MEDIA_DOC = "media_document"


@dataclass
class RawFinding:
    """
    An unscored candidate finding straight out of an extraction engine.
    Analysis (regex/entropy/identity) and scoring happen downstream —
    this object should stay dumb and just carry provenance + raw text.
    """

    source_type: SourceType
    raw_text: str                      # the actual string of interest (email, path, GPS coord, etc.)
    context: str = ""                   # surrounding context: commit hash, filename, line number
    origin: str = ""                    # repo path / file path this came from
    metadata: dict = field(default_factory=dict)  # freeform extra fields (timestamp, author, etc.)
