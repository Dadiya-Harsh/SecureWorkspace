"""
Unit tests for WorkspaceHeader serialization, parsing, and dual-path unlocking.
"""

import pytest
from nacl.exceptions import CryptoError

from secureworkspace_core.workspace.header import (
    EXPECTED_HEADER_SIZE,
    WorkspaceHeader,
)


def test_header_create_and_serialization_roundtrip():
    header, recovery_phrase, wmk = WorkspaceHeader.create(
        name="Personal Vault",
        password="MyMasterPassword123!",
    )

    raw_bytes = header.to_bytes()
    assert len(raw_bytes) == EXPECTED_HEADER_SIZE
    assert len(raw_bytes) == 246

    parsed_header = WorkspaceHeader.from_bytes(raw_bytes)
    assert parsed_header.workspace_id == header.workspace_id
    assert parsed_header.name == "Personal Vault"
    assert parsed_header.opslimit == header.opslimit
    assert parsed_header.memlimit == header.memlimit
    assert parsed_header.password_salt == header.password_salt
    assert parsed_header.recovery_salt == header.recovery_salt
    assert parsed_header.wrapped_wmk_password == header.wrapped_wmk_password
    assert parsed_header.wrapped_wmk_recovery == header.wrapped_wmk_recovery


def test_header_unlock_with_password():
    password = "MasterPassword#999"
    header, _, original_wmk = WorkspaceHeader.create("Test", password)

    unlocked_wmk = header.unlock_with_password(password)
    assert unlocked_wmk == original_wmk


def test_header_unlock_with_recovery_key():
    password = "MasterPassword#999"
    header, recovery_phrase, original_wmk = WorkspaceHeader.create("Test", password)

    unlocked_wmk = header.unlock_with_recovery_key(recovery_phrase)
    assert unlocked_wmk == original_wmk


def test_header_unlock_with_wrong_password():
    header, _, _ = WorkspaceHeader.create("Test", "CorrectPassword123")
    with pytest.raises(CryptoError):
        header.unlock_with_password("WrongPassword123")


def test_header_unlock_with_wrong_recovery_key():
    header, _, _ = WorkspaceHeader.create("Test", "CorrectPassword123")
    # Valid BIP-39 phrase with valid checksum, but different words (different key)
    other_phrase = "abandon " * 23 + "art"
    with pytest.raises(CryptoError):
        header.unlock_with_recovery_key(other_phrase)


def test_header_invalid_magic():
    header, _, _ = WorkspaceHeader.create("Test", "Password123")
    data = bytearray(header.to_bytes())
    data[0:4] = b"BAD!"
    with pytest.raises(ValueError, match="Invalid workspace header magic"):
        WorkspaceHeader.from_bytes(bytes(data))


def test_header_invalid_size():
    with pytest.raises(ValueError, match="Invalid header size"):
        WorkspaceHeader.from_bytes(b"\x00" * 100)
