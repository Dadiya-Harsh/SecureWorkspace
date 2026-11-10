"""
Unit tests for WorkspaceManager, WorkspaceLock, and safety snapshots.
"""

from pathlib import Path
import time
import pytest
import nacl.utils

from secureworkspace_core.workspace.manager import (
    WorkspaceLock,
    WorkspaceLockedError,
    WorkspaceManager,
)


@pytest.fixture
def meta_key() -> bytes:
    return nacl.utils.random(32)


def test_workspace_layout_and_is_workspace(tmp_path: Path, meta_key: bytes):
    workspace_dir = tmp_path / "my_workspace"

    assert WorkspaceManager.is_workspace(workspace_dir) is False

    mgr = WorkspaceManager(workspace_dir, meta_key=meta_key)
    mgr.init_workspace()

    assert WorkspaceManager.is_workspace(workspace_dir) is True
    assert mgr.dot_dir.is_dir()
    assert mgr.snapshots_dir.is_dir()
    assert mgr.temp_dir.is_dir()
    assert mgr.db_path.is_file()

    mgr.close()


def test_workspace_lock_concurrency(tmp_path: Path):
    lock_file = tmp_path / "test.lock"

    lock1 = WorkspaceLock(lock_file)
    lock2 = WorkspaceLock(lock_file)

    # First lock succeeds
    lock1.acquire()

    # Second lock fails
    with pytest.raises(WorkspaceLockedError, match="locked by another process"):
        lock2.acquire()

    # Release first lock
    lock1.release()

    # Now second lock succeeds
    lock2.acquire()
    lock2.release()


def test_workspace_manager_lock_context(tmp_path: Path, meta_key: bytes):
    mgr1 = WorkspaceManager(tmp_path, meta_key=meta_key)
    mgr1.init_workspace()

    with mgr1.acquire_lock():
        mgr2 = WorkspaceManager(tmp_path, meta_key=meta_key)
        with pytest.raises(WorkspaceLockedError):
            mgr2.lock()

    # After exit from context, mgr2 can lock
    mgr2.lock()
    mgr2.unlock()
    mgr1.close()
    mgr2.close()


def test_safety_snapshot_create_and_restore(tmp_path: Path, meta_key: bytes):
    mgr = WorkspaceManager(tmp_path, meta_key=meta_key)
    mgr.init_workspace()

    # Create a test file
    test_file = tmp_path / "docs" / "secrets.txt"
    test_file.parent.mkdir(parents=True, exist_ok=True)
    original_content = b"Top secret password database 2026"
    test_file.write_bytes(original_content)

    # 1. Create safety snapshot
    snap_record = mgr.create_safety_snapshot("docs/secrets.txt", reason="pre-pull-test")
    assert snap_record.original_path == "docs/secrets.txt"
    assert snap_record.size == len(original_content)
    assert snap_record.reason == "pre-pull-test"

    snapshot_file_on_disk = mgr.snapshots_dir / snap_record.snapshot_path
    assert snapshot_file_on_disk.is_file()
    assert snapshot_file_on_disk.read_bytes() == original_content

    # 2. Modify original file
    test_file.write_bytes(b"Completely overwritten garbage")
    assert test_file.read_bytes() != original_content

    # 3. Restore snapshot
    restored_path = mgr.restore_safety_snapshot(snap_record.snapshot_id)
    assert restored_path == test_file
    assert test_file.read_bytes() == original_content

    # 4. List snapshots
    snaps = mgr.list_safety_snapshots()
    assert len(snaps) == 1
    assert snaps[0].snapshot_id == snap_record.snapshot_id

    # 5. Tampered snapshot fails restore
    snapshot_file_on_disk.write_bytes(b"tampered content")
    with pytest.raises(ValueError, match="integrity verification failed"):
        mgr.restore_safety_snapshot(snap_record.snapshot_id)

    # 6. Delete snapshot
    assert mgr.delete_safety_snapshot(snap_record.snapshot_id) is True
    assert not snapshot_file_on_disk.exists()
    assert len(mgr.list_safety_snapshots()) == 0

    mgr.close()


def test_temp_file_manager(tmp_path: Path, meta_key: bytes):
    mgr = WorkspaceManager(tmp_path, meta_key=meta_key)
    mgr.init_workspace()

    temp_mgr = mgr.temp_manager

    # Test temp_file context manager
    with temp_mgr.temp_file(suffix=".bin") as tmp:
        assert tmp.is_file()
        tmp.write_bytes(b"temporary secret stream chunk")
        temp_path = tmp
        assert temp_path.exists()

    # Should be cleaned up upon exit from context
    assert not temp_path.exists()

    # Test manual temp file creation and cleanup_all
    f1 = temp_mgr.create_temp_file(suffix=".tmp")
    f2 = temp_mgr.create_temp_file(suffix=".tmp")
    f1.write_bytes(b"dummy1")
    f2.write_bytes(b"dummy2")

    assert f1.is_file()
    assert f2.is_file()

    cleaned = temp_mgr.cleanup_all()
    assert cleaned >= 2
    assert not f1.exists()
    assert not f2.exists()

    mgr.close()
