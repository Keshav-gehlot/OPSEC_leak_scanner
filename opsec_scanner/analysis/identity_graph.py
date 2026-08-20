"""
Identity Graph Matcher.

This is what stops "internal IP found in some unrelated public repo"
from scoring identically to "internal IP found in a repo the target
actually owns". Every finding gets checked against the TargetProfile's
known aliases/emails/domains/handles (and optionally GPS proximity to
a known home/office location) to produce a confidence multiplier.

This module is intentionally simple string/geo matching rather than
NLP — spaCy NER is a v2 upgrade once there's a reason to disambiguate
fuzzy name matches; for now exact/substring matching against a known
identity set already kills most false positives cheaply.
"""

from __future__ import annotations

import math
import re
from dataclasses import dataclass

from opsec_scanner.config import TargetProfile

# Confidence multiplier tiers — used directly as C_target in the risk formula.
CONFIDENCE_DIRECT_MATCH = 1.5      # exact match against a known identity string
CONFIDENCE_DOMAIN_MATCH = 1.2      # domain-level match (e.g. email domain matches a known internal domain)
CONFIDENCE_PROXIMITY_MATCH = 1.3   # GPS within proximity radius of a known home/office coordinate
CONFIDENCE_GENERIC = 0.5           # no correlation to the target profile at all

GPS_PROXIMITY_RADIUS_KM = 5.0  # findings within this radius of home_coordinates get boosted


@dataclass
class IdentityMatchResult:
    confidence_multiplier: float
    reason: str


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance between two lat/lon points, in km."""
    r = 6371.0  # Earth radius km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def _extract_gps(raw_text: str) -> tuple[float, float] | None:
    """Parses 'lat,lon' or 'lat lon' style strings from media_engine GPS findings."""
    m = re.match(r"\s*(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)\s*$", raw_text)
    if not m:
        return None
    try:
        return float(m.group(1)), float(m.group(2))
    except ValueError:
        return None


def match_identity(raw_text: str, profile: TargetProfile) -> IdentityMatchResult:
    """
    Scores a single piece of matched text against the target's identity
    profile. Returns the confidence multiplier to feed into risk scoring,
    plus a human-readable reason for the dashboard/report.

    Matching uses word boundaries, not naive substring containment —
    a short alias like "sam" must not match inside "sample" or
    "username". Emails/domains still match as substrings since they're
    inherently multi-token and false-positive risk is much lower there.
    """
    text_lower = raw_text.lower()
    identity_strings = profile.all_identity_strings()

    # Direct match: the finding literally contains one of the target's
    # known names/aliases/emails/handles, bounded so short aliases don't
    # false-positive inside unrelated longer words.
    for identity_str in identity_strings:
        if not identity_str:
            continue
        if "@" in identity_str or "." in identity_str:
            # Emails/domains: substring match is fine, they're distinctive enough.
            if identity_str in text_lower:
                return IdentityMatchResult(
                    confidence_multiplier=CONFIDENCE_DIRECT_MATCH,
                    reason=f"Direct match against known identity string '{identity_str}'",
                )
        else:
            # Plain names/aliases/handles: require a word boundary so
            # "sam" doesn't match inside "sample" or "username".
            if re.search(rf"\b{re.escape(identity_str)}\b", text_lower):
                return IdentityMatchResult(
                    confidence_multiplier=CONFIDENCE_DIRECT_MATCH,
                    reason=f"Direct match against known identity string '{identity_str}'",
                )

    # Domain-level match: an email or hostname in the finding shares a
    # domain with one of the target's known domains, even if the exact
    # string isn't in the profile (e.g. new-employee@company.internal
    # when only company.internal itself is listed).
    for domain in profile.domains:
        if domain and domain.lower() in text_lower:
            return IdentityMatchResult(
                confidence_multiplier=CONFIDENCE_DOMAIN_MATCH,
                reason=f"Domain-level match against known domain '{domain}'",
            )

    # GPS proximity: if this finding is a GPS coordinate pair and the
    # profile has a home/office location on file, check distance.
    if profile.home_coordinates:
        coords = _extract_gps(raw_text)
        if coords:
            distance = _haversine_km(coords[0], coords[1], *profile.home_coordinates)
            if distance <= GPS_PROXIMITY_RADIUS_KM:
                return IdentityMatchResult(
                    confidence_multiplier=CONFIDENCE_PROXIMITY_MATCH,
                    reason=f"GPS coordinates within {distance:.2f}km of known home/office location",
                )

    return IdentityMatchResult(
        confidence_multiplier=CONFIDENCE_GENERIC,
        reason="No correlation found against target identity profile (generic/low-confidence match)",
    )
