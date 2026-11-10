"""
Unit tests for WorkspaceCatalog serialization, entry tracking, and encrypted index.
"""

import nacl.utils
import pytest
from nacl.exceptions import CryptoError

from secureworkspace_core.workspace.catalog import (
    WorkspaceCatalog,
    WorkspaceEntry,
)


def test_catalog_entries_and_normalization():
    catalog = WorkspaceCatalog()
    entry1 = WorkspaceEntry(
        path=r"documents\subfolder\report.pdf",
        file_id_hex="a" * 32,
        size=1024,
        sha256="b" * 64,
        mtime_ms=1600000000000,
    )
    catalog.add_entry(entry1)

    # Retrieval should work with normalized POSIX or Windows path
    assert catalog.get_entry("documents/subfolder/report.pdf") is not None
    assert catalog.get_entry(r"documents\subfolder\report.pdf") is not None

    # Removal
    assert catalog.remove_entry("documents/subfolder/report.pdf") is True
    assert catalog.get_entry("documents/subfolder/report.pdf") is None


def test_catalog_encrypted_serialization_roundtrip():
    wmk = nacl.utils.random(32)
    catalog = WorkspaceCatalog()

    catalog.add_entry(
        WorkspaceEntry(
            path="file1.txt",
            file_id_hex="1" * 32,
            size=100,
            sha256="a" * 64,
            mtime_ms=1700000000000,
        )
    )
    catalog.add_entry(
        WorkspaceEntry(
            path="images/logo.png",
            file_id_hex="2" * 32,
            size=50000,
            sha256="c" * 64,
            mtime_ms=1700000001000,
        )
    )

    # 1. Encrypt catalog
    ciphertext = catalog.serialize_encrypted(wmk)
    assert len(ciphertext) > 0
    # Must not contain plaintext paths in the ciphertext
    assert b"file1.txt" not in ciphertext
    assert b"images/logo.png" not in ciphertext

    # 2. Decrypt catalog
    restored = WorkspaceCatalog.deserialize_encrypted(ciphertext, wmk)
    entries = restored.list_entries()
    assert len(entries) == 2
    assert entries[0].path == "file1.txt"
    assert entries[1].path == "images/logo.png"


def test_catalog_decrypt_with_wrong_wmk():
    wmk1 = nacl.utils.random(32)
    wmk2 = nacl.utils.random(32)

    catalog = WorkspaceCatalog()
    catalog.add_entry(
        WorkspaceEntry(
            path="secret.txt",
            file_id_hex="f" * 32,
            size=50,
            sha256="d" * 64,
            mtime_ms=1000,
        )
    )

    ciphertext = catalog.serialize_encrypted(wmk1)

    with pytest.raises(CryptoError):
        WorkspaceCatalog.deserialize_encrypted(ciphertext, wmk2)
