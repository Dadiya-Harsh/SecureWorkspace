"""
Unit tests for PushEngine and push operations.
Tests push previews, object uploads, manifest construction, atomic HEAD updates,
refusal when remote is ahead, race condition rejection, and mass deletion guards.
"""

from pathlib import Path
import pytest
import nacl.utils

from secureworkspace_core.crypto.keys import derive_meta_key, generate_wmk
from secureworkspace_core.storage.mock import MockStorageAdapter
from secureworkspace_core.sync.errors import (
    ConcurrentPushError,
    DriveAheadError,
    MassDeletionGuardError,
)
from secureworkspace_core.sync.manifest import RemoteManifestManager
from secureworkspace_core.sync.push import PushEngine
from secureworkspace_core.workspace.manager import WorkspaceManager


@pytest.fixture
def wmk() -> bytes:
    return generate_wmk()


@pytest.fixture
def push_env(tmp_path: Path, wmk: bytes):
    meta_key = derive_meta_key(wmk)
    ws_dir = tmp_path / "workspace"
    manager = WorkspaceManager(ws_dir, meta_key=meta_key)
    manager.init_workspace()

    storage = MockStorageAdapter()
    manifest_mgr = RemoteManifestManager(storage, wmk)
    push_engine = PushEngine(manager, manifest_mgr)

    yield manager, manifest_mgr, storage, push_engine
    manager.close()


def test_push_version_one(push_env):
    manager, manifest_mgr, storage, push_engine = push_env

    # Create 2 local files
    f1 = manager.root_path / "doc.txt"
    f1.write_text("Hello document", encoding="utf-8")

    sub = manager.root_path / "code"
    sub.mkdir(parents=True, exist_ok=True)
    f2 = sub / "script.py"
    f2.write_text("print('SecureWorkspace')", encoding="utf-8")

    # 1. Preview
    preview = push_engine.push_preview()
    assert not preview.is_refused
    assert len(preview.files_to_upload) == 2
    assert len(preview.files_to_delete) == 0

    # 2. Push Version 1
    res = push_engine.push(message="Initial commit")
    assert res.success
    assert res.new_version == 1
    assert res.files_uploaded == 2

    # 3. Verify Remote Storage
    assert manifest_mgr.get_remote_head() == 1
    manifest = manifest_mgr.get_manifest(1)
    assert manifest.version_number == 1
    assert manifest.message == "Initial commit"
    assert len(manifest.entries) == 2

    # Check remote objects exist and do NOT leak plaintext
    remote_files = storage.list_files()
    object_files = [f for f in remote_files if f.name.startswith("objects/")]
    assert len(object_files) == 2
    for obj in object_files:
        obj_bytes = storage.download_bytes(obj.id)
        assert b"Hello document" not in obj_bytes
        assert b"SecureWorkspace" not in obj_bytes

    # 4. Verify Local Database
    assert manager.db.get_state("base_version") == "1"
    local_files = manager.db.list_files()
    assert len(local_files) == 2
    for lf in local_files:
        assert lf.sync_status == "SYNCED"


def test_push_no_changes(push_env):
    manager, manifest_mgr, storage, push_engine = push_env

    f = manager.root_path / "file.txt"
    f.write_text("content", encoding="utf-8")
    push_engine.push(message="Commit 1")

    # Push again without changing anything
    res2 = push_engine.push(message="Commit 2")
    assert res2.success
    assert res2.files_uploaded == 0
    assert res2.new_version == 1
    assert manifest_mgr.get_remote_head() == 1


def test_push_refused_when_drive_is_ahead(push_env):
    manager, manifest_mgr, storage, push_engine = push_env

    f = manager.root_path / "file.txt"
    f.write_text("content", encoding="utf-8")
    push_engine.push(message="Commit 1")

    # Advance remote HEAD to 2 (simulating another device pushed)
    manifest_mgr.update_remote_head(new_version=2)

    # Edit file locally
    f.write_text("edited content", encoding="utf-8")

    preview = push_engine.push_preview()
    assert preview.is_refused
    assert "Drive has newer versions" in preview.refusal_reason

    with pytest.raises(DriveAheadError, match="Drive has newer versions"):
        push_engine.push(message="Commit 2 should fail")


def test_concurrent_push_race_aborts(push_env):
    manager, manifest_mgr, storage, push_engine = push_env

    f = manager.root_path / "file.txt"
    f.write_text("content", encoding="utf-8")

    # Hook into storage.upload_bytes to simulate another device updating HEAD mid-push
    original_upload_bytes = storage.upload_bytes

    def race_upload_bytes(data, remote_name, folder_id=None):
        ret = original_upload_bytes(data, remote_name, folder_id=folder_id)
        # When manifest is uploaded, another device sneaks in and updates HEAD to 99
        if remote_name.startswith("versions/"):
            original_upload_bytes(b"99\n", "HEAD", folder_id=folder_id)
        return ret

    storage.upload_bytes = race_upload_bytes

    with pytest.raises(ConcurrentPushError, match="Remote HEAD changed concurrently"):
        push_engine.push(message="Racing push")


def test_mass_deletion_guard(push_env):
    manager, manifest_mgr, storage, push_engine = push_env

    # Create 8 files
    for i in range(8):
        (manager.root_path / f"file_{i}.txt").write_text(f"content {i}", encoding="utf-8")

    push_engine.push(message="Initial 8 files")
    assert manifest_mgr.get_remote_head() == 1

    # Delete 6 files locally (> 5 files and > 50% of workspace)
    for i in range(6):
        (manager.root_path / f"file_{i}.txt").unlink()

    preview = push_engine.push_preview()
    assert preview.is_mass_deletion

    # Push without confirm_mass_deletion fails
    with pytest.raises(MassDeletionGuardError, match="Mass deletion detected"):
        push_engine.push(message="Accidental mass deletion")

    # Push with confirm_mass_deletion succeeds
    res = push_engine.push(message="Confirmed mass deletion", confirm_mass_deletion=True)
    assert res.success
    assert res.new_version == 2
    assert res.files_deleted == 6

    manifest_v2 = manifest_mgr.get_manifest(2)
    assert len(manifest_v2.entries) == 2
