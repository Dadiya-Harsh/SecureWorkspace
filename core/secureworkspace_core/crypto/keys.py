"""
Key management and wrapping functions for SecureWorkspace.
Handles:
- Workspace Master Key (WMK) generation
- Key wrapping & unwrapping via SecretBox (XChaCha20-Poly1305)
- Subkey derivation for per-file keys and index keys via BLAKE2b
"""

from typing import Tuple
import nacl.encoding as encoding
import nacl.hash
import nacl.secret
import nacl.utils
from nacl.exceptions import CryptoError

from secureworkspace_core.constants import (
    CONTEXT_FILE_KEY,
    CONTEXT_INDEX_KEY,
    KEY_BYTES,
    NONCE_BYTES,
)


def generate_wmk() -> bytes:
    """Generates a cryptographically secure 256-bit Workspace Master Key (WMK)."""
    return nacl.utils.random(KEY_BYTES)


def wrap_wmk(wmk: bytes, kek: bytes) -> Tuple[bytes, bytes]:
    """
    Wraps the 32-byte Workspace Master Key using the Key Encryption Key (KEK).
    Returns (nonce: 24 bytes, ciphertext: 48 bytes [32B key + 16B Poly1305 MAC]).
    """
    if len(wmk) != KEY_BYTES:
        raise ValueError(f"WMK must be {KEY_BYTES} bytes, got {len(wmk)}")
    if len(kek) != KEY_BYTES:
        raise ValueError(f"KEK must be {KEY_BYTES} bytes, got {len(kek)}")

    box = nacl.secret.SecretBox(kek)
    nonce = nacl.utils.random(NONCE_BYTES)
    # box.encrypt prepends the nonce; we slice it out to store nonce and ciphertext cleanly
    encrypted = box.encrypt(wmk, nonce)
    ciphertext = encrypted[NONCE_BYTES:]
    return nonce, ciphertext


def unwrap_wmk(ciphertext: bytes, nonce: bytes, kek: bytes) -> bytes:
    """
    Unwraps the Workspace Master Key using the Key Encryption Key (KEK).
    Raises CryptoError if KEK is wrong or data is corrupted.
    """
    if len(kek) != KEY_BYTES:
        raise ValueError(f"KEK must be {KEY_BYTES} bytes, got {len(kek)}")
    if len(nonce) != NONCE_BYTES:
        raise ValueError(f"Nonce must be {NONCE_BYTES} bytes, got {len(nonce)}")

    box = nacl.secret.SecretBox(kek)
    combined = nonce + ciphertext
    try:
        return box.decrypt(combined)
    except CryptoError:
        raise CryptoError("Failed to unwrap Workspace Master Key: authentication failed (wrong key or corrupted data).")


def derive_file_key(wmk: bytes, file_id: bytes) -> bytes:
    """
    Derives a deterministic 256-bit per-file encryption key from the WMK
    using BLAKE2b keyed hashing with 'SW_FKEY_' personalization.
    """
    if len(wmk) != KEY_BYTES:
        raise ValueError(f"WMK must be {KEY_BYTES} bytes, got {len(wmk)}")

    return nacl.hash.generichash(
        file_id,
        digest_size=KEY_BYTES,
        key=wmk,
        person=CONTEXT_FILE_KEY,
        encoder=encoding.RawEncoder,
    )


def derive_index_key(wmk: bytes) -> bytes:
    """
    Derives the 256-bit index encryption key from the WMK
    using BLAKE2b keyed hashing with 'SW_INDX_' personalization.
    """
    if len(wmk) != KEY_BYTES:
        raise ValueError(f"WMK must be {KEY_BYTES} bytes, got {len(wmk)}")

    return nacl.hash.generichash(
        b"workspace_index_catalog",
        digest_size=KEY_BYTES,
        key=wmk,
        person=CONTEXT_INDEX_KEY,
        encoder=encoding.RawEncoder,
    )
