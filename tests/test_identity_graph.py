from opsec_scanner.config import TargetProfile
from opsec_scanner.analysis.identity_graph import match_identity, CONFIDENCE_DIRECT_MATCH, CONFIDENCE_GENERIC


def _profile(**kwargs):
    return TargetProfile(name=kwargs.get("name", "Test User"), **{k: v for k, v in kwargs.items() if k != "name"})


def test_short_alias_does_not_false_positive_on_substring():
    profile = _profile(aliases=["sam"])
    result = match_identity("this is a sample of the data", profile)
    assert result.confidence_multiplier == CONFIDENCE_GENERIC


def test_short_alias_matches_as_standalone_word():
    profile = _profile(aliases=["sam"])
    result = match_identity("reach out to sam directly", profile)
    assert result.confidence_multiplier == CONFIDENCE_DIRECT_MATCH


def test_email_matches_as_substring():
    profile = _profile(emails=["john.doe@gmail.com"])
    result = match_identity("author: john.doe@gmail.com <john.doe@gmail.com>", profile)
    assert result.confidence_multiplier == CONFIDENCE_DIRECT_MATCH


def test_domain_matches_subdomain():
    profile = _profile(domains=["staging.co"])
    result = match_identity("postgres://admin:pw@db.internal.staging.co:5432/main", profile)
    assert result.confidence_multiplier == CONFIDENCE_DIRECT_MATCH


def test_gps_proximity_match():
    profile = _profile(home_coordinates=(37.7749, -122.4194))
    # ~0.5km away from the home coordinate
    result = match_identity("37.7790,-122.4150", profile)
    assert result.confidence_multiplier > CONFIDENCE_GENERIC


def test_no_match_returns_generic():
    profile = _profile(aliases=["johndoe"])
    result = match_identity("completely unrelated string with no overlap", profile)
    assert result.confidence_multiplier == CONFIDENCE_GENERIC
