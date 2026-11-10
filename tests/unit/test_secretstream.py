"""
Unit tests for SecretStreamEncryptor and SecretStreamDecryptor.
"""

import io
import os
import nacl.utils
import pytest
from nacl.exceptions import CryptoError

from secureworkspace_core.crypto.secretstream import (
    SecretStreamDecryptor,
    SecretStreamEncryptor,
)


def test_roundtrip_empty_data():
    key = nacl.utils.random(32)
    enc = SecretStreamEncryptor(key)
    dec = SecretStreamDecryptor(key)

    source = io.BytesIO(b"")
    encrypted_dest = io.BytesIO()
    enc.encrypt(source, encrypted_dest)

    encrypted_dest.seek(0)
    decrypted_dest = io.BytesIO()
    dec.decrypt(encrypted_dest, decrypted_dest)

    assert decrypted_dest.getvalue() == b""


def test_roundtrip_small_data():
    key = nacl.utils.random(32)
    enc = SecretStreamEncryptor(key)
    dec = SecretStreamDecryptor(key)

    data = b"Hello, SecureWorkspace streaming cryptography!"
    source = io.BytesIO(data)
    encrypted_dest = io.BytesIO()
    enc.encrypt(source, encrypted_dest)

    encrypted_dest.seek(0)
    decrypted_dest = io.BytesIO()
    dec.decrypt(encrypted_dest, decrypted_dest)

    assert decrypted_dest.getvalue() == data


def test_roundtrip_multichunk_data():
    key = nacl.utils.random(32)
    # Using 16 KB chunks for testing multi-chunk transitions
    chunk_size = 16 * 1024
    enc = SecretStreamEncryptor(key, chunk_size=chunk_size)
    dec = SecretStreamDecryptor(key)

    data = os.urandom(75 * 1024)  # 75 KB spans ~5 chunks
    source = io.BytesIO(data)
    encrypted_dest = io.BytesIO()
    enc.encrypt(source, encrypted_dest)

    encrypted_dest.seek(0)
    decrypted_dest = io.BytesIO()
    dec.decrypt(encrypted_dest, decrypted_dest)

    assert decrypted_dest.getvalue() == data


def test_decrypt_with_wrong_key():
    key1 = nacl.utils.random(32)
    key2 = nacl.utils.random(32)
    enc = SecretStreamEncryptor(key1)
    dec = SecretStreamDecryptor(key2)

    source = io.BytesIO(b"Secret Document")
    encrypted_dest = io.BytesIO()
    enc.encrypt(source, encrypted_dest)

    encrypted_dest.seek(0)
    decrypted_dest = io.BytesIO()
    with pytest.raises(CryptoError):
        dec.decrypt(encrypted_dest, decrypted_dest)


def test_decrypt_corrupted_ciphertext():
    key = nacl.utils.random(32)
    enc = SecretStreamEncryptor(key)
    dec = SecretStreamDecryptor(key)

    source = io.BytesIO(b"A" * 1000)
    encrypted_dest = io.BytesIO()
    enc.encrypt(source, encrypted_dest)

    raw_bytes = bytearray(encrypted_dest.getvalue())
    # Corrupt a byte in the payload
    raw_bytes[40] ^= 0xFF

    corrupted_stream = io.BytesIO(raw_bytes)
    decrypted_dest = io.BytesIO()
    with pytest.raises(CryptoError):
        dec.decrypt(corrupted_stream, decrypted_dest)


def test_decrypt_truncated_stream():
    key = nacl.utils.random(32)
    enc = SecretStreamEncryptor(key)
    dec = SecretStreamDecryptor(key)

    source = io.BytesIO(b"A" * 5000)
    encrypted_dest = io.BytesIO()
    enc.encrypt(source, encrypted_dest)

    # Truncate the last 20 bytes (removing part of chunk and MAC)
    truncated = encrypted_dest.getvalue()[:-20]

    decrypted_dest = io.BytesIO()
    with pytest.raises(CryptoError):
        dec.decrypt(io.BytesIO(truncated), decrypted_dest)


def test_decrypt_invalid_magic():
    key = nacl.utils.random(32)
    dec = SecretStreamDecryptor(key)
    with pytest.raises(CryptoError, match="Invalid file magic"):
        dec.decrypt(io.BytesIO(b"XXXX" + b"\x00" * 50), io.BytesIO())
