"""
Unit tests for VersionManifest and RemoteManifestManager.
Tests manifest serialization, SecretStream encryption/decryption,
HEAD version tracking, concurrent push race checks, and object transfers.
"""

from pathlib import Path
import pytest
import nacl.utils
from nacl.exceptions import CryptoError

from secureworkspace_core.crypto.keys import generate_wmk
from secureworkspace_core.storage.mock import MockStorageAdapter
from secureworkspace_core.sync.errors import (
    ConcurrentPushError,
    ManifestNotFoundError,
)
from secureworkspace_core.sync.manifest import (
    RemoteManifestManager,
    VersionManifest,
)
from secureworkspace_core.workspace.catalog import WorkspaceEntry


@pytest.fixture
def wmk() -> bytes:
    return generate_wmk()


@pytest.fixture
def mock_storage() -> MockStorageAdapter:
    return MockStorageAdapter()


def test_version_manifest_serialization_and_crypto(wmk: bytes):
    entry1 = WorkspaceEntry(
        path="notes/todo.txt",
        file_id_hex="0123456789abcdef0123456789abcdef",
        size=1024,
        sha256="abc123sha256",
        mtime_ms=1700000000000,
    )
    entry2 = WorkspaceEntry(
        path="images/photo.png",
        file_id_hex="fedcba9876543210fedcba9876543210",
        size=20480,
        sha256="def456sha256",
        mtime_ms=1700000005000,
    )

    manifest = VersionManifest(
        version_number=1,
        manifest_id="manifest_uuid_001",
        timestamp_ms=1700000010000,
        device_id="desktop_win11",
        message="Initial setup",
        entries=[entry1, entry2],
    )

    # 1. Encrypt manifest
    ciphertext = manifest.serialize_encrypted(wmk)
    assert len(ciphertext) > 0
    # Assert plaintext does not leak
    assert b"manifest_uuid_001" not in ciphertext
    assert b"todo.txt" not in ciphertext
    assert b"desktop_win11" not in ciphertext

    # 2. Decrypt manifest with correct WMK
    decrypted = VersionManifest.deserialize_encrypted(ciphertext, wmk)
    assert decrypted.version_number == 1
    assert decrypted.manifest_id == "manifest_uuid_001"
    assert decrypted.device_id == "desktop_win11"
    assert decrypted.message == "Initial setup"
    assert len(decrypted.entries) == 2
    assert decrypted.entries[0].path == "notes/todo.txt"
    assert decrypted.entries[1].path == "images/photo.png"

    # 3. Wrong WMK fails decryption
    wrong_wmk = generate_wmk()
    with pytest.raises(CryptoError):
        VersionManifest.deserialize_encrypted(ciphertext, wrong_wmk)


def test_remote_manifest_manager_head_and_versions(mock_storage: MockStorageAdapter, wmk: bytes):
    mgr = RemoteManifestManager(mock_storage, wmk)

    # Initially remote HEAD is 0
    assert mgr.get_remote_head() == 0

    # Create and upload version 1
    v1 = VersionManifest(
        version_number=1,
        manifest_id="m1",
        timestamp_ms=1000,
        device_id="dev1",
        message="v1 commit",
        entries=[
            WorkspaceEntry("a.txt", "id1", 10, "h1", 1000)
        ],
    )
    mgr.upload_manifest(v1)
    mgr.update_remote_head(new_version=1, expected_head=0)
    assert mgr.get_remote_head() == 1

    # Fetch manifest 1
    fetched_v1 = mgr.get_manifest(1)
    assert fetched_v1.version_number == 1
    assert fetched_v1.message == "v1 commit"
    assert len(fetched_v1.entries) == 1

    # Upload version 2
    v2 = VersionManifest(
        version_number=2,
        manifest_id="m2",
        timestamp_ms=2000,
        device_id="dev1",
        message="v2 commit",
        entries=[
            WorkspaceEntry("a.txt", "id1", 10, "h1", 1000),
            WorkspaceEntry("b.txt", "id2", 20, "h2", 2000),
        ],
    )
    mgr.upload_manifest(v2)
    mgr.update_remote_head(new_version=2, expected_head=1)
    assert mgr.get_remote_head() == 2

    # List all versions
    all_versions = mgr.list_remote_versions()
    assert len(all_versions) == 2
    # Newest first
    assert all_versions[0].version_number == 2
    assert all_versions[1].version_number == 1


def test_concurrent_push_race_detection(mock_storage: MockStorageAdapter, wmk: bytes):
    mgr = RemoteManifestManager(mock_storage, wmk)
    mgr.update_remote_head(new_version=1)

    # Attempting to update HEAD expecting head=0 when current is 1 raises ConcurrentPushError
    with pytest.raises(ConcurrentPushError, match="Remote HEAD changed concurrently"):
        mgr.update_remote_head(new_version=2, expected_head=0)


def test_object_upload_and_download(tmp_path: Path, mock_storage: MockStorageAdapter, wmk: bytes):
    mgr = RemoteManifestManager(mock_storage, wmk)

    # Prepare local encrypted object
    src_file = tmp_path / "obj.bin"
    src_file.write_bytes(b"encrypted_chunk_data_12345")

    file_id_hex = "abcdef0123456789abcdef0123456789"
    mgr.upload_object(str(src_file), file_id_hex)

    # Verify object exists remotely
    found = mgr.find_remote_object(file_id_hex)
    assert found is not None
    assert found.name == f"objects/{file_id_hex}"

    # Download object to clean location
    dest_file = tmp_path / "downloaded_obj.bin"
    mgr.download_object(file_id_hex, str(dest_file))
    assert dest_file.read_bytes() == b"encrypted_chunk_data_12345"
