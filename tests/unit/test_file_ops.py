"""
Unit tests for high-level file encryption and decryption operations.
"""

import os
import tempfile
import uuid
import nacl.utils
import pytest
from nacl.exceptions import CryptoError

from secureworkspace_core.workspace.file_ops import (
    decrypt_file,
    encrypt_file,
)


def test_file_encrypt_decrypt_roundtrip():
    wmk = nacl.utils.random(32)
    file_id = uuid.uuid4().bytes

    with tempfile.TemporaryDirectory() as tmpdir:
        input_file = os.path.join(tmpdir, "input.txt")
        encrypted_file = os.path.join(tmpdir, "encrypted.sw")
        decrypted_file = os.path.join(tmpdir, "decrypted.txt")

        # 1. Create original test file (120 KB random data)
        sample_data = os.urandom(120 * 1024)
        with open(input_file, "wb") as f:
            f.write(sample_data)

        # 2. Encrypt
        meta = encrypt_file(input_file, encrypted_file, wmk, file_id=file_id)
        assert meta.plaintext_size == 120 * 1024
        assert meta.ciphertext_size > meta.plaintext_size
        assert meta.file_id == file_id

        # 3. Decrypt
        dec_hash = decrypt_file(encrypted_file, decrypted_file, wmk, file_id)
        assert dec_hash == meta.plaintext_sha256

        # 4. Verify disk contents match
        with open(decrypted_file, "rb") as f:
            assert f.read() == sample_data


def test_file_decrypt_wrong_wmk():
    wmk1 = nacl.utils.random(32)
    wmk2 = nacl.utils.random(32)
    file_id = uuid.uuid4().bytes

    with tempfile.TemporaryDirectory() as tmpdir:
        input_file = os.path.join(tmpdir, "input.txt")
        encrypted_file = os.path.join(tmpdir, "encrypted.sw")
        decrypted_file = os.path.join(tmpdir, "decrypted.txt")

        with open(input_file, "wb") as f:
            f.write(b"Confidential Record")

        encrypt_file(input_file, encrypted_file, wmk1, file_id=file_id)

        with pytest.raises(CryptoError):
            decrypt_file(encrypted_file, decrypted_file, wmk2, file_id)


def test_file_decrypt_wrong_file_id():
    wmk = nacl.utils.random(32)
    file_id1 = uuid.uuid4().bytes
    file_id2 = uuid.uuid4().bytes

    with tempfile.TemporaryDirectory() as tmpdir:
        input_file = os.path.join(tmpdir, "input.txt")
        encrypted_file = os.path.join(tmpdir, "encrypted.sw")
        decrypted_file = os.path.join(tmpdir, "decrypted.txt")

        with open(input_file, "wb") as f:
            f.write(b"Confidential Record")

        encrypt_file(input_file, encrypted_file, wmk, file_id=file_id1)

        with pytest.raises(CryptoError):
            decrypt_file(encrypted_file, decrypted_file, wmk, file_id=file_id2)
