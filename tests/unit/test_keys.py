"""
Unit tests for key hierarchy, wrapping, dual-path recovery, and subkey derivation.
"""

import nacl.utils
import pytest
from nacl.exceptions import CryptoError

from secureworkspace_core.crypto.kdf import (
    derive_kek_from_password,
    derive_kek_from_recovery_entropy,
)
from secureworkspace_core.crypto.keys import (
    derive_file_key,
    derive_index_key,
    derive_meta_key,
    generate_wmk,
    unwrap_wmk,
    wrap_wmk,
)
from secureworkspace_core.crypto.recovery import (
    generate_recovery_phrase,
    phrase_to_entropy,
)


def test_wmk_generation():
    wmk1 = generate_wmk()
    wmk2 = generate_wmk()
    assert len(wmk1) == 32
    assert len(wmk2) == 32
    assert wmk1 != wmk2


def test_dual_path_key_wrapping():
    # 1. Generate Workspace Master Key
    wmk = generate_wmk()

    # 2. Setup Password Path
    password = "SuperSecretPassword#2026"
    pwd_salt = nacl.utils.random(16)
    pwd_kek = derive_kek_from_password(password, pwd_salt)
    pwd_nonce, pwd_wrapped = wrap_wmk(wmk, pwd_kek)

    # 3. Setup Recovery Key Path
    recovery_phrase = generate_recovery_phrase()
    rec_entropy = phrase_to_entropy(recovery_phrase)
    rec_salt = nacl.utils.random(16)
    rec_kek = derive_kek_from_recovery_entropy(rec_entropy, rec_salt)
    rec_nonce, rec_wrapped = wrap_wmk(wmk, rec_kek)

    # 4. Verify password path unwraps the exact WMK
    unwrapped_from_pwd = unwrap_wmk(pwd_wrapped, pwd_nonce, pwd_kek)
    assert unwrapped_from_pwd == wmk

    # 5. Verify recovery path unwraps the exact same WMK
    unwrapped_from_rec = unwrap_wmk(rec_wrapped, rec_nonce, rec_kek)
    assert unwrapped_from_rec == wmk


def test_unwrap_with_wrong_password_kek():
    wmk = generate_wmk()
    salt = nacl.utils.random(16)
    correct_kek = derive_kek_from_password("CorrectPassword123", salt)
    wrong_kek = derive_kek_from_password("WrongPassword999", salt)

    nonce, wrapped = wrap_wmk(wmk, correct_kek)

    with pytest.raises(CryptoError, match="authentication failed"):
        unwrap_wmk(wrapped, nonce, wrong_kek)


def test_unwrap_with_corrupted_ciphertext():
    wmk = generate_wmk()
    salt = nacl.utils.random(16)
    kek = derive_kek_from_password("CorrectPassword123", salt)
    nonce, wrapped = wrap_wmk(wmk, kek)

    # Corrupt 1 byte in wrapped ciphertext
    corrupted_wrapped = bytearray(wrapped)
    corrupted_wrapped[10] ^= 0xFF

    with pytest.raises(CryptoError, match="authentication failed"):
        unwrap_wmk(bytes(corrupted_wrapped), nonce, kek)


def test_subkey_derivation():
    wmk = generate_wmk()
    file_id_1 = b"file-uuid-000001"
    file_id_2 = b"file-uuid-000002"

    key_f1 = derive_file_key(wmk, file_id_1)
    key_f1_again = derive_file_key(wmk, file_id_1)
    key_f2 = derive_file_key(wmk, file_id_2)
    key_index = derive_index_key(wmk)
    key_meta = derive_meta_key(wmk)

    assert len(key_f1) == 32
    assert len(key_f2) == 32
    assert len(key_index) == 32
    assert len(key_meta) == 32

    # Determinism
    assert key_f1 == key_f1_again
    assert key_meta == derive_meta_key(wmk)
    # Separation
    assert key_f1 != key_f2
    assert key_f1 != key_index
    assert key_f1 != key_meta
    assert key_index != key_meta
