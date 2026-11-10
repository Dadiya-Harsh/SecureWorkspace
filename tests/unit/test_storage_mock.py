"""
Unit tests for MockStorageAdapter and StorageAdapter contract.
"""

import os
import tempfile
import pytest

from secureworkspace_core.storage.adapter import (
    FileNotFoundOnStorageError,
    FolderBoundaryViolationError,
)
from secureworkspace_core.storage.mock import MockStorageAdapter


def test_mock_storage_crud():
    adapter = MockStorageAdapter()
    root_id = adapter.ensure_app_folder()
    assert root_id == "mock_secureworkspace_folder_root"

    # 1. Upload bytes
    data = b"Hello SecureStorage!"
    remote = adapter.upload_bytes(data, "test.enc")
    assert remote.name == "test.enc"
    assert remote.size == len(data)
    assert remote.parent_id == root_id

    # 2. List files
    files = adapter.list_files()
    assert len(files) == 1
    assert files[0].id == remote.id

    # 3. Download bytes
    downloaded = adapter.download_bytes(remote.id)
    assert downloaded == data

    # 4. Get metadata
    meta = adapter.get_metadata(remote.id)
    assert meta.id == remote.id
    assert meta.size == len(data)

    # 5. Delete
    adapter.delete_file(remote.id)
    assert len(adapter.list_files()) == 0

    with pytest.raises(FileNotFoundOnStorageError):
        adapter.download_bytes(remote.id)


def test_mock_storage_file_upload_download():
    adapter = MockStorageAdapter()

    with tempfile.TemporaryDirectory() as tmpdir:
        src_path = os.path.join(tmpdir, "local_test.bin")
        dst_path = os.path.join(tmpdir, "downloaded.bin")
        test_payload = b"A" * 50000

        with open(src_path, "wb") as f:
            f.write(test_payload)

        progress_calls = []

        def on_progress(current, total):
            progress_calls.append((current, total))

        remote = adapter.upload_file(src_path, "remote_file.bin", progress_callback=on_progress)
        assert len(progress_calls) > 0
        assert remote.size == 50000

        adapter.download_file(remote.id, dst_path)
        with open(dst_path, "rb") as f:
            assert f.read() == test_payload


def test_mock_storage_boundary_protection():
    adapter = MockStorageAdapter(root_folder_id="trusted_folder")

    # Attempt to upload with illegal parent folder
    with pytest.raises(FolderBoundaryViolationError):
        adapter.upload_bytes(b"data", "evil.txt", folder_id="unauthorized_folder_id")

    # Create a file inside an unauthorized folder manually to test download/delete boundary checks
    unauthorized_file = adapter.upload_bytes(b"data", "file.txt", folder_id="trusted_folder")
    # Manually tamper parent_id in mock
    tampered_meta, data = adapter._storage[unauthorized_file.id]
    tampered_meta.parent_id = "alien_folder"
    adapter._storage[unauthorized_file.id] = (tampered_meta, data)

    with pytest.raises(FolderBoundaryViolationError, match="not inside the app folder"):
        adapter.download_bytes(unauthorized_file.id)

    with pytest.raises(FolderBoundaryViolationError, match="not inside the app folder"):
        adapter.delete_file(unauthorized_file.id)
