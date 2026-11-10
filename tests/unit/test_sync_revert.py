"""
Unit tests for force_push, revert_workspace, and restore_file_version.
Verifies PRD requirements for non-destructive history, force push, and rollbacks.
"""

from pathlib import Path
import pytest
import nacl.utils

from secureworkspace_core.crypto.keys import derive_meta_key, generate_wmk
from secureworkspace_core.storage.mock import MockStorageAdapter
from secureworkspace_core.sync.errors import DriveAheadError
from secureworkspace_core.sync.manifest import RemoteManifestManager
from secureworkspace_core.sync.pull import PullEngine
from secureworkspace_core.sync.push import PushEngine
from secureworkspace_core.sync.revert import (
    force_push,
    restore_file_version,
    revert_workspace,
)
from secureworkspace_core.sync.status import StatusEngine
from secureworkspace_core.workspace.manager import WorkspaceManager


@pytest.fixture
def wmk() -> bytes:
    return generate_wmk()


@pytest.fixture
def shared_storage() -> MockStorageAdapter:
    return MockStorageAdapter()


def test_force_push_workflow(tmp_path: Path, wmk: bytes, shared_storage: MockStorageAdapter):
    meta_key = derive_meta_key(wmk)

    # 1. Device 1 pushes version 1
    dev1_dir = tmp_path / "dev1"
    mgr1 = WorkspaceManager(dev1_dir, meta_key=meta_key)
    mgr1.init_workspace()
    manifest_mgr1 = RemoteManifestManager(shared_storage, wmk)
    push1 = PushEngine(mgr1, manifest_mgr1)

    (dev1_dir / "common.txt").write_text("Common V1", encoding="utf-8")
    push1.push(message="v1")

    # 2. Device 2 joins at version 1
    dev2_dir = tmp_path / "dev2"
    mgr2 = WorkspaceManager(dev2_dir, meta_key=meta_key)
    mgr2.init_workspace()
    manifest_mgr2 = RemoteManifestManager(shared_storage, wmk)
    pull2 = PullEngine(mgr2, manifest_mgr2)
    push2 = PushEngine(mgr2, manifest_mgr2)
    pull2.pull(confirm=True)

    # 3. Device 1 pushes version 2 ahead of Device 2
    (dev1_dir / "common.txt").write_text("Common V2 from dev1", encoding="utf-8")
    push1.push(message="v2")
    assert manifest_mgr1.get_remote_head() == 2

    # 4. Device 2 has local edits at base_version 1
    (dev2_dir / "common.txt").write_text("Common V2 from dev2 divergence", encoding="utf-8")

    # Normal push is refused
    with pytest.raises(DriveAheadError):
        push2.push(message="Should fail")

    # Force push without confirmation is rejected
    with pytest.raises(ValueError, match="requires explicit confirm=True"):
        force_push(push2, message="Force push without confirm", confirm=False)

    # Force push with confirm=True succeeds and creates version 3
    res = force_push(push2, message="Device 2 force push", confirm=True)
    assert res.success
    assert res.new_version == 3
    assert manifest_mgr2.get_remote_head() == 3

    # All versions (1, 2, 3) remain intact in Drive history
    history = manifest_mgr2.list_remote_versions()
    assert len(history) == 3
    assert [v.version_number for v in history] == [3, 2, 1]

    mgr1.close()
    mgr2.close()


def test_revert_workspace_workflow(tmp_path: Path, wmk: bytes, shared_storage: MockStorageAdapter):
    meta_key = derive_meta_key(wmk)

    dev_dir = tmp_path / "dev"
    mgr = WorkspaceManager(dev_dir, meta_key=meta_key)
    mgr.init_workspace()
    manifest_mgr = RemoteManifestManager(shared_storage, wmk)
    push_engine = PushEngine(mgr, manifest_mgr)
    status_engine = StatusEngine(mgr, manifest_mgr)

    # 1. Push Version 1: file_a
    (dev_dir / "file_a.txt").write_text("File A Content V1", encoding="utf-8")
    push_engine.push(message="v1")
    assert manifest_mgr.get_remote_head() == 1

    # 2. Push Version 2: file_a modified + file_b added
    (dev_dir / "file_a.txt").write_text("File A Content V2", encoding="utf-8")
    (dev_dir / "file_b.txt").write_text("File B Content V2", encoding="utf-8")
    push_engine.push(message="v2")
    assert manifest_mgr.get_remote_head() == 2

    # 3. Revert workspace to Version 1
    revert_res = revert_workspace(
        version_number=1,
        manager=mgr,
        manifest_manager=manifest_mgr,
        confirm=True,
    )
    assert revert_res.reverted_to_version == 1
    assert revert_res.files_restored == 1
    assert revert_res.files_deleted == 1
    assert revert_res.snapshots_created >= 1

    # File A is back to V1 content
    assert (dev_dir / "file_a.txt").read_text(encoding="utf-8") == "File A Content V1"
    # File B was deleted locally
    assert not (dev_dir / "file_b.txt").exists()

    # Revert creates unpushed local changes (staged as MODIFIED)
    status = status_engine.status()
    assert status.has_local_changes

    # Push as Version 3
    push_res = push_engine.push(message="Reverted to v1")
    assert push_res.new_version == 3
    assert manifest_mgr.get_remote_head() == 3

    mgr.close()


def test_restore_single_file_version(tmp_path: Path, wmk: bytes, shared_storage: MockStorageAdapter):
    meta_key = derive_meta_key(wmk)

    dev_dir = tmp_path / "dev"
    mgr = WorkspaceManager(dev_dir, meta_key=meta_key)
    mgr.init_workspace()
    manifest_mgr = RemoteManifestManager(shared_storage, wmk)
    push_engine = PushEngine(mgr, manifest_mgr)

    todo_file = dev_dir / "todo.txt"
    other_file = dev_dir / "other.txt"

    # Version 1
    todo_file.write_text("1. Buy milk", encoding="utf-8")
    other_file.write_text("Other content", encoding="utf-8")
    push_engine.push(message="v1")

    # Version 2: todo.txt modified
    todo_file.write_text("1. Buy coffee and sugar", encoding="utf-8")
    push_engine.push(message="v2")

    # Restore todo.txt from Version 1
    restored_path = restore_file_version(
        relative_path="todo.txt",
        version_number=1,
        manager=mgr,
        manifest_manager=manifest_mgr,
    )

    assert restored_path == todo_file
    assert todo_file.read_text(encoding="utf-8") == "1. Buy milk"
    # other.txt was unaffected
    assert other_file.read_text(encoding="utf-8") == "Other content"

    # Pre-restore safety snapshot exists for the v2 content
    snaps = mgr.list_safety_snapshots()
    assert len(snaps) >= 1
    snap = snaps[0]
    restored_snap = mgr.restore_safety_snapshot(snap.snapshot_id)
    assert restored_snap.read_text(encoding="utf-8") == "1. Buy coffee and sugar"

    mgr.close()
