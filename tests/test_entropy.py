from opsec_scanner.analysis.entropy import calculate_entropy, is_high_entropy, extract_high_entropy_tokens


def test_empty_string_zero_entropy():
    assert calculate_entropy("") == 0.0


def test_repeated_char_low_entropy():
    assert calculate_entropy("aaaaaaaaaa") == 0.0


def test_random_looking_string_high_entropy():
    # Entropy is capped by log2(length) for all-unique-character strings,
    # so this needs to be long enough to clear the 3.5 threshold — see
    # the calibration note in entropy.py for why 4.5 was too strict.
    assert is_high_entropy("aB3xK9mZ2pQ7wRcD5fH8jL1nP6qS4tV", threshold=3.5)


def test_human_password_low_entropy():
    # Plausible human-typed "secret" — should NOT trip the high-entropy gate,
    # this is the exact case that motivated the entropy check in the first place.
    assert not is_high_entropy("SuperSecretValue2024", threshold=4.5)


def test_extract_high_entropy_tokens_filters_short_tokens():
    text = "key=AKIAIOSFODNN7EXAMPLE short=ab"
    tokens = extract_high_entropy_tokens(text, threshold=3.0, min_length=12)
    matched = [t for t, _ in tokens]
    assert any("AKIA" in t for t in matched)
    assert not any(t == "ab" for t in matched)
