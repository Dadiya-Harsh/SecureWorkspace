"""
Unit tests for BIP-39 recovery phrase generation, decoding, and checksum verification.
"""

import pytest
from secureworkspace_core.crypto.recovery import (
    entropy_to_phrase,
    generate_recovery_phrase,
    phrase_to_entropy,
)
from secureworkspace_core.crypto.wordlist import WORDLIST


def test_generate_recovery_phrase():
    phrase = generate_recovery_phrase()
    words = phrase.split()
    assert len(words) == 24
    for word in words:
        assert word in WORDLIST


def test_roundtrip_entropy_to_phrase():
    entropy = b"\x01" * 32
    phrase = entropy_to_phrase(entropy)
    words = phrase.split()
    assert len(words) == 24

    recovered_entropy = phrase_to_entropy(phrase)
    assert recovered_entropy == entropy


def test_invalid_entropy_length():
    with pytest.raises(ValueError, match="Entropy must be exactly 32 bytes"):
        entropy_to_phrase(b"\x00" * 16)


def test_invalid_phrase_word_count():
    phrase = generate_recovery_phrase()
    words = phrase.split()
    # 23 words
    with pytest.raises(ValueError, match="must contain exactly 24 words"):
        phrase_to_entropy(" ".join(words[:23]))

    # 25 words
    with pytest.raises(ValueError, match="must contain exactly 24 words"):
        phrase_to_entropy(phrase + " abandon")


def test_unknown_word_in_phrase():
    phrase = generate_recovery_phrase()
    words = phrase.split()
    words[5] = "notarealwordxyz"
    with pytest.raises(ValueError, match="Invalid recovery word 'notarealwordxyz'"):
        phrase_to_entropy(" ".join(words))


def test_checksum_failure_on_corrupted_phrase():
    phrase = generate_recovery_phrase()
    words = phrase.split()
    # Swap two words (which are valid dictionary words, but alter the checksum)
    words[0], words[1] = words[1], words[0]
    with pytest.raises(ValueError, match="checksum mismatch"):
        phrase_to_entropy(" ".join(words))
