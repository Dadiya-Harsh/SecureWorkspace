"""
BIP-39 Standard 24-word Recovery Key implementation.
Provides 256 bits of cryptographic entropy with an 8-bit SHA-256 checksum.
"""

import hashlib
import nacl.utils
from secureworkspace_core.crypto.wordlist import WORDLIST, WORD_INDEX


def generate_recovery_phrase() -> str:
    """
    Generates a secure 24-word BIP-39 recovery phrase from 256 bits of CSPRNG entropy.
    """
    entropy = nacl.utils.random(32)  # 256 bits
    return entropy_to_phrase(entropy)


def entropy_to_phrase(entropy: bytes) -> str:
    """
    Converts 32 bytes (256 bits) of entropy into a 24-word recovery phrase with checksum.
    """
    if len(entropy) != 32:
        raise ValueError(f"Entropy must be exactly 32 bytes (256 bits), got {len(entropy)}")

    # 1. Compute 8-bit checksum: first byte of SHA-256(entropy)
    checksum = hashlib.sha256(entropy).digest()[0]

    # 2. Combine 256 bits of entropy + 8 bits of checksum = 264 bits total
    entropy_int = int.from_bytes(entropy, "big")
    combined = (entropy_int << 8) | checksum

    # 3. Split 264 bits into 24 chunks of 11 bits each
    words = []
    for i in range(23, -1, -1):
        idx = (combined >> (i * 11)) & 0x7FF  # 0x7FF = 2047 (11 bits)
        words.append(WORDLIST[idx])

    return " ".join(words)


def phrase_to_entropy(phrase: str) -> bytes:
    """
    Converts a 24-word recovery phrase back into 32 bytes of entropy.
    Validates word vocabulary, length, and the SHA-256 checksum.
    Raises ValueError on any invalid word, length, or checksum failure.
    """
    words = phrase.strip().lower().split()
    if len(words) != 24:
        raise ValueError(f"Recovery phrase must contain exactly 24 words, got {len(words)}")

    # Convert words to 11-bit indices
    combined = 0
    for i, word in enumerate(words):
        if word not in WORD_INDEX:
            raise ValueError(f"Invalid recovery word '{word}' at position {i + 1}")
        idx = WORD_INDEX[word]
        combined = (combined << 11) | idx

    # Separate 256-bit entropy and 8-bit checksum
    extracted_checksum = combined & 0xFF
    entropy_int = combined >> 8
    entropy = entropy_int.to_bytes(32, "big")

    # Verify checksum
    expected_checksum = hashlib.sha256(entropy).digest()[0]
    if extracted_checksum != expected_checksum:
        raise ValueError(
            "Recovery key validation failed: checksum mismatch. "
            "Please check for typos or incorrect word order."
        )

    return entropy
