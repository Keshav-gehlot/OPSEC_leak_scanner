"""
Shannon entropy scoring.

Used to separate real random secrets (API keys, tokens) from static
placeholder strings that merely *look* like they could be secrets
(e.g. "password123", "example_key_here"). High entropy on a string
that also matches a credential-shaped regex is a strong signal;
low entropy on the same match usually means a placeholder/test value.
"""

from __future__ import annotations

import math
from collections import Counter


def calculate_entropy(s: str) -> float:
    """
    Shannon entropy: H(X) = - sum( P(x_i) * log2(P(x_i)) )
    Returns bits of entropy per character. Empty/1-char strings return 0.
    """
    if not s:
        return 0.0

    length = len(s)
    counts = Counter(s)

    entropy = 0.0
    for count in counts.values():
        p = count / length
        entropy -= p * math.log2(p)

    return entropy


def is_high_entropy(s: str, threshold: float = 3.5) -> bool:
    """
    Convenience wrapper.

    CALIBRATION NOTE: threshold was originally set to 4.5, following the
    original design doc, but testing against realistic secret lengths
    showed this was miscalibrated — a genuinely random 16-20 character
    alphanumeric secret only averages ~3.75-4.0 bits/char (entropy is
    capped by log2(alphabet_size) and diluted further by any repeated
    characters), meaning a 4.5 threshold silently filtered out most
    real-world API keys/tokens of typical length.

    3.5 catches the large majority of real random secrets 16+ characters
    long. The tradeoff: some human-typed "strong-looking" passwords
    (e.g. "SuperSecretValue2024", ~3.5 bits/char) will occasionally clear
    this bar too. That's an intentional bias — for a security scanner,
    a false positive report is far cheaper than a missed real secret.
    Pure per-character Shannon entropy cannot perfectly separate these
    two cases at short-medium lengths; production secret scanners
    (gitleaks, trufflehog) supplement it with charset-diversity checks
    and dictionary lookups, which would be the natural next improvement
    here rather than tuning this single number further.
    """
    return calculate_entropy(s) >= threshold


def extract_high_entropy_tokens(text: str, threshold: float = 3.5, min_length: int = 12) -> list[tuple[str, float]]:
    """
    Scans free text for individual "token-like" substrings (split on
    whitespace and common delimiters) and returns those whose entropy
    clears the threshold, alongside their score. min_length filters out
    short tokens that trivially score high entropy by chance.
    """
    import re

    # Split on whitespace, quotes, and common key=value delimiters while
    # keeping the token itself intact (e.g. don't split inside a base64 blob).
    candidates = re.split(r'[\s"\'`,;]+', text)

    results = []
    for token in candidates:
        token = token.strip()
        if len(token) < min_length:
            continue
        score = calculate_entropy(token)
        if score >= threshold:
            results.append((token, score))

    return results
