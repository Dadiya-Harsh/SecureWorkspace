"""
Validation of cryptographic functions against official published test vectors.
"""

import json
import os
import pytest

from secureworkspace_core.crypto.kdf import (
    derive_kek_from_password,
    derive_kek_from_recovery_entropy,
)
from secureworkspace_core.crypto.keys import (
    derive_file_key,
    derive_index_key,
)
from secureworkspace_core.crypto.recovery import phrase_to_entropy


def test_against_published_vectors():
    vector_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        "specs",
        "encryption-format",
        "test_vectors.json",
    )
    assert os.path.exists(vector_path), f"Missing vector file: {vector_path}"

    with open(vector_path, "r", encoding="utf-8") as f:
        vectors = json.load(f)

    # 1. Test Password KDF Vector
    kdf_sec = vectors["kdf"]
    pwd = kdf_sec["password"]
    pwd_salt = bytes.fromhex(kdf_sec["password_salt_hex"])
    expected_pwd_kek = kdf_sec["derived_password_kek_hex"]

    actual_pwd_kek = derive_kek_from_password(pwd, pwd_salt).hex()
    assert actual_pwd_kek == expected_pwd_kek

    # 2. Test Recovery Entropy and KDF Vector
    rec_phrase = kdf_sec["recovery_phrase"]
    expected_entropy = kdf_sec["recovery_entropy_hex"]
    actual_entropy = phrase_to_entropy(rec_phrase).hex()
    assert actual_entropy == expected_entropy

    rec_salt = bytes.fromhex(kdf_sec["recovery_salt_hex"])
    expected_rec_kek = kdf_sec["derived_recovery_kek_hex"]
    actual_rec_kek = derive_kek_from_recovery_entropy(
        bytes.fromhex(actual_entropy), rec_salt
    ).hex()
    assert actual_rec_kek == expected_rec_kek

    # 3. Test Subkeys Vector
    subkeys_sec = vectors["subkeys"]
    wmk = bytes.fromhex(subkeys_sec["wmk_hex"])
    file_id = bytes.fromhex(subkeys_sec["file_id_hex"])

    actual_file_key = derive_file_key(wmk, file_id).hex()
    assert actual_file_key == subkeys_sec["derived_file_key_hex"]

    actual_index_key = derive_index_key(wmk).hex()
    assert actual_index_key == subkeys_sec["derived_index_key_hex"]
