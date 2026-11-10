"""
Key Derivation Functions (KDF) using Argon2id via PyNaCl.
Derives 256-bit Key Encryption Keys (KEK) from passwords and recovery entropy.
"""

import nacl.pwhash.argon2id as argon2
from secureworkspace_core.constants import KEY_BYTES

# Default interactive limits (fast and memory-hard: 64 MB RAM)
DEFAULT_OPSLIMIT = argon2.OPSLIMIT_INTERACTIVE
DEFAULT_MEMLIMIT = argon2.MEMLIMIT_INTERACTIVE


def derive_kek_from_password(
    password: str,
    salt: bytes,
    opslimit: int = DEFAULT_OPSLIMIT,
    memlimit: int = DEFAULT_MEMLIMIT,
) -> bytes:
    """
    Derives a 32-byte Key Encryption Key (KEK) from a user master password using Argon2id.
    """
    if not password:
        raise ValueError("Password cannot be empty.")
    if len(salt) != 16:
        raise ValueError(f"Salt must be exactly 16 bytes, got {len(salt)}")

    return argon2.kdf(
        KEY_BYTES,
        password.encode("utf-8"),
        salt,
        opslimit=opslimit,
        memlimit=memlimit,
    )


def derive_kek_from_recovery_entropy(
    entropy: bytes,
    salt: bytes,
    opslimit: int = DEFAULT_OPSLIMIT,
    memlimit: int = DEFAULT_MEMLIMIT,
) -> bytes:
    """
    Derives a 32-byte Key Encryption Key (KEK) from 256-bit recovery entropy using Argon2id.
    """
    if len(entropy) != 32:
        raise ValueError(f"Recovery entropy must be exactly 32 bytes, got {len(entropy)}")
    if len(salt) != 16:
        raise ValueError(f"Salt must be exactly 16 bytes, got {len(salt)}")

    return argon2.kdf(
        KEY_BYTES,
        entropy,
        salt,
        opslimit=opslimit,
        memlimit=memlimit,
    )
