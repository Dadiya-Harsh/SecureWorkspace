"""
Crypto module exports for SecureWorkspace.
"""

from secureworkspace_core.crypto.kdf import (
    derive_kek_from_password,
    derive_kek_from_recovery_entropy,
)
from secureworkspace_core.crypto.keys import (
    derive_file_key,
    derive_index_key,
    generate_wmk,
    unwrap_wmk,
    wrap_wmk,
)
from secureworkspace_core.crypto.recovery import (
    entropy_to_phrase,
    generate_recovery_phrase,
    phrase_to_entropy,
)

__all__ = [
    "derive_kek_from_password",
    "derive_kek_from_recovery_entropy",
    "generate_wmk",
    "wrap_wmk",
    "unwrap_wmk",
    "derive_file_key",
    "derive_index_key",
    "generate_recovery_phrase",
    "entropy_to_phrase",
    "phrase_to_entropy",
]
