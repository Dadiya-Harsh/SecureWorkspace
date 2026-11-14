"""
Unit tests for PullEngine.
Tests pull previews, clean-device downloads, atomic swaps,
safety snapshots for overwritten/deleted local changes, and deletion handling.
"""

from pathlib import Path
import pytest
import nacl.utils

from secureworkspace_core.crypto.keys import derive_meta_key, generate_wmk
from secureworkspace_core.storage.mock import MockStorageAdapter
from secureworkspace_core.sync.errors import DivergedWorkspaceError
from secureworkspace_core.sync.manifest import RemoteManifestManager
from secureworkspace_core.sync.pull import PullEngine
from secureworkspace_core.sync.push import PushEngine
from secureworkspace_core.workspace.manager import WorkspaceManager


@pytest.fixture
def wmk() -> bytes:
    return generate_wmk()


@pytest.fixture
def shared_storage() -> MockStorageAdapter:
    return MockStorageAdapter()


def test_clean_device_pull(tmp_path: Path, wmk: bytes, shared_storage: MockStorageAdapter):
    meta_key = derive_meta_key(wmk)

    # 1. Device 1 creates and pushes version 1
    dev1_dir = tmp_path / "dev1"
    mgr1 = WorkspaceManager(dev1_dir, meta_key=meta_key)
    mgr1.init_workspace()
    manifest_mgr1 = RemoteManifestManager(shared_storage, wmk)
    push1 = PushEngine(mgr1, manifest_mgr1)

    (dev1_dir / "report.pdf").write_bytes(b"PDF report content bytes")
    sub = dev1_dir / "data"
    sub.mkdir(parents=True, exist_ok=True)
    (sub / "records.json").write_text('{"records": [1, 2, 3]}', encoding="utf-8")

    push1.push(message="Dev 1 initial push")
    assert manifest_mgr1.get_remote_head() == 1

    # 2. Device 2 (clean device) pulls version 1
    dev2_dir = tmp_path / "dev2"
    mgr2 = WorkspaceManager(dev2_dir, meta_key=meta_key)
    mgr2.init_workspace()
    manifest_mgr2 = RemoteManifestManager(shared_storage, wmk)
    pull2 = PullEngine(mgr2, manifest_mgr2)

    # Preview
    preview = pull2.pull_preview()
    assert preview.remote_head == 1
    assert not preview.is_up_to_date
    assert len(preview.files_to_download) == 2
    assert len(preview.files_to_delete) == 0

    # Execute Pull
    result = pull2.pull(confirm=True)
    assert result.pulled_version == 1
    assert result.files_downloaded == 2

    # Verify files on disk match Device 1
    assert (dev2_dir / "report.pdf").read_bytes() == b"PDF report content bytes"
    assert (dev2_dir / "data" / "records.json").read_text(encoding="utf-8") == '{"records": [1, 2, 3]}'

    # Verify SQLite DB on Device 2
    assert mgr2.db.get_state("base_version") == "1"
    files2 = mgr2.db.list_files()
    assert len(files2) == 2
    for f in files2:
        assert f.sync_status == "SYNCED"

    mgr1.close()
    mgr2.close()


def test_pull_creates_safety_snapshots_for_local_edits(
    tmp_path: Path, wmk: bytes, shared_storage: MockStorageAdapter
):
    meta_key = derive_meta_key(wmk)

    # Device 1: pushes version 1
    dev1_dir = tmp_path / "dev1"
    mgr1 = WorkspaceManager(dev1_dir, meta_key=meta_key)
    mgr1.init_workspace()
    manifest_mgr1 = RemoteManifestManager(shared_storage, wmk)
    push1 = PushEngine(mgr1, manifest_mgr1)

    f1 = dev1_dir / "notes.txt"
    f1.write_text("Version 1 content", encoding="utf-8")
    push1.push(message="v1")

    # Device 2: pulls version 1
    dev2_dir = tmp_path / "dev2"
    mgr2 = WorkspaceManager(dev2_dir, meta_key=meta_key)
    mgr2.init_workspace()
    manifest_mgr2 = RemoteManifestManager(shared_storage, wmk)
    pull2 = PullEngine(mgr2, manifest_mgr2)
    pull2.pull(confirm=True)

    # Device 2 edits notes.txt locally without pushing
    f2 = dev2_dir / "notes.txt"
    f2.write_text("Device 2 local unpushed draft", encoding="utf-8")

    # Device 1 modifies notes.txt and pushes version 2
    f1.write_text("Version 2 content from dev1", encoding="utf-8")
    push1.push(message="v2")
    assert manifest_mgr1.get_remote_head() == 2

    # Device 2 pulls version 2: should detect conflict and snapshot
    prev = pull2.pull_preview()
    assert "notes.txt" in prev.files_to_snapshot
    assert "notes.txt" in prev.conflicting_files

    # Merge strategy should raise DivergedWorkspaceError on conflict
    with pytest.raises(DivergedWorkspaceError):
        pull2.pull(confirm=True, strategy="merge")

    # Keep remote strategy resolves conflict by applying remote and creating snapshot
    res = pull2.pull(confirm=True, strategy="keep_remote")
    assert res.pulled_version == 2
    assert res.snapshots_created >= 1

    # Local file now contains version 2 content
    assert f2.read_text(encoding="utf-8") == "Version 2 content from dev1"

    # But Device 2's unpushed draft is saved in safety snapshots
    snapshots = mgr2.list_safety_snapshots()
    assert len(snapshots) >= 1
    snap = snapshots[0]
    assert snap.original_path == "notes.txt"

    # Restore snapshot and verify original unpushed content is safe
    restored = mgr2.restore_safety_snapshot(snap.snapshot_id)
    assert restored.read_text(encoding="utf-8") == "Device 2 local unpushed draft"

    mgr1.close()
    mgr2.close()


def test_pull_handles_remote_deletions(
    tmp_path: Path, wmk: bytes, shared_storage: MockStorageAdapter
):
    meta_key = derive_meta_key(wmk)

    # Device 1: pushes 2 files
    dev1_dir = tmp_path / "dev1"
    mgr1 = WorkspaceManager(dev1_dir, meta_key=meta_key)
    mgr1.init_workspace()
    manifest_mgr1 = RemoteManifestManager(shared_storage, wmk)
    push1 = PushEngine(mgr1, manifest_mgr1)

    (dev1_dir / "keep.txt").write_text("Keep me", encoding="utf-8")
    (dev1_dir / "delete_me.txt").write_text("Delete me", encoding="utf-8")
    push1.push(message="v1 with 2 files")

    # Device 2: pulls version 1
    dev2_dir = tmp_path / "dev2"
    mgr2 = WorkspaceManager(dev2_dir, meta_key=meta_key)
    mgr2.init_workspace()
    manifest_mgr2 = RemoteManifestManager(shared_storage, wmk)
    pull2 = PullEngine(mgr2, manifest_mgr2)
    pull2.pull(confirm=True)
    assert (dev2_dir / "delete_me.txt").is_file()

    # Device 1: deletes delete_me.txt and pushes version 2
    (dev1_dir / "delete_me.txt").unlink()
    push1.push(message="v2 removed delete_me.txt")
    assert manifest_mgr1.get_remote_head() == 2

    # Device 2: pulls version 2
    prev = pull2.pull_preview()
    assert "delete_me.txt" in prev.files_to_delete

    res = pull2.pull(confirm=True)
    assert res.files_deleted == 1
    assert not (dev2_dir / "delete_me.txt").exists()
    assert (dev2_dir / "keep.txt").exists()

    mgr1.close()
    mgr2.close()


def test_git_like_pull_preserves_unpushed_local_files(
    tmp_path: Path, wmk: bytes, shared_storage: MockStorageAdapter
):
    """
    Verifies that a pull does NOT delete unpushed local files.
    Remote additions are downloaded and applied on top of local work.
    """
    meta_key = derive_meta_key(wmk)

    dev1_dir = tmp_path / "dev1"
    mgr1 = WorkspaceManager(dev1_dir, meta_key=meta_key)
    mgr1.init_workspace()
    manifest_mgr1 = RemoteManifestManager(shared_storage, wmk)
    push1 = PushEngine(mgr1, manifest_mgr1)

    (dev1_dir / "shared_doc.txt").write_text("Version 1 base", encoding="utf-8")
    push1.push(message="v1")

    dev2_dir = tmp_path / "dev2"
    mgr2 = WorkspaceManager(dev2_dir, meta_key=meta_key)
    mgr2.init_workspace()
    manifest_mgr2 = RemoteManifestManager(shared_storage, wmk)
    pull2 = PullEngine(mgr2, manifest_mgr2)
    pull2.pull(confirm=True)

    # Device 2 adds a local unpushed file
    local_unpushed = dev2_dir / "my_local_work.docx"
    local_unpushed.write_bytes(b"Important local docx binary data")

    # Device 1 adds another file and pushes v2
    (dev1_dir / "server_announcement.pdf").write_bytes(b"PDF bytes")
    push1.push(message="v2 with server_announcement")
    assert manifest_mgr1.get_remote_head() == 2

    # Device 2 pulls v2
    prev2 = pull2.pull_preview()
    assert "my_local_work.docx" not in prev2.files_to_delete
    assert len(prev2.conflicting_files) == 0

    res = pull2.pull(confirm=True, strategy="merge")
    assert res.pulled_version == 2
    assert res.files_downloaded == 1

    # VERIFY: Device 2's unpushed file is PRESERVED!
    assert local_unpushed.is_file()
    assert local_unpushed.read_bytes() == b"Important local docx binary data"
    assert (dev2_dir / "server_announcement.pdf").read_bytes() == b"PDF bytes"

    mgr1.close()
    mgr2.close()


def test_pull_conflict_keep_both(
    tmp_path: Path, wmk: bytes, shared_storage: MockStorageAdapter
):
    """
    Verifies that 'keep_both' saves the incoming remote file with '(Drive conflict)' suffix.
    """
    meta_key = derive_meta_key(wmk)

    dev1_dir = tmp_path / "dev1"
    mgr1 = WorkspaceManager(dev1_dir, meta_key=meta_key)
    mgr1.init_workspace()
    manifest_mgr1 = RemoteManifestManager(shared_storage, wmk)
    push1 = PushEngine(mgr1, manifest_mgr1)

    (dev1_dir / "code.py").write_text("print('v1')", encoding="utf-8")
    push1.push(message="v1")

    dev2_dir = tmp_path / "dev2"
    mgr2 = WorkspaceManager(dev2_dir, meta_key=meta_key)
    mgr2.init_workspace()
    manifest_mgr2 = RemoteManifestManager(shared_storage, wmk)
    pull2 = PullEngine(mgr2, manifest_mgr2)
    pull2.pull(confirm=True)

    # Both devices edit code.py
    (dev2_dir / "code.py").write_text("print('dev2 local changes')", encoding="utf-8")
    (dev1_dir / "code.py").write_text("print('dev1 remote changes')", encoding="utf-8")
    push1.push(message="v2 dev1")

    # Device 2 pulls with keep_both
    res = pull2.pull(confirm=True, strategy="keep_both")
    assert res.pulled_version == 2

    # Local file is untouched
    assert (dev2_dir / "code.py").read_text(encoding="utf-8") == "print('dev2 local changes')"

    # Drive conflict copy is created
    conflict_file = dev2_dir / "code (Drive conflict).py"
    assert conflict_file.is_file()
    assert conflict_file.read_text(encoding="utf-8") == "print('dev1 remote changes')"

    mgr1.close()
    mgr2.close()


def test_hard_reset(
    tmp_path: Path, wmk: bytes, shared_storage: MockStorageAdapter
):
    """
    Verifies that hard_reset cleanly resets working copy to remote HEAD.
    """
    meta_key = derive_meta_key(wmk)

    dev1_dir = tmp_path / "dev1"
    mgr1 = WorkspaceManager(dev1_dir, meta_key=meta_key)
    mgr1.init_workspace()
    manifest_mgr1 = RemoteManifestManager(shared_storage, wmk)
    push1 = PushEngine(mgr1, manifest_mgr1)

    (dev1_dir / "doc.txt").write_text("Remote doc content", encoding="utf-8")
    push1.push(message="v1")

    dev2_dir = tmp_path / "dev2"
    mgr2 = WorkspaceManager(dev2_dir, meta_key=meta_key)
    mgr2.init_workspace()
    manifest_mgr2 = RemoteManifestManager(shared_storage, wmk)
    pull2 = PullEngine(mgr2, manifest_mgr2)
    pull2.pull(confirm=True)

    # Device 2 has dirty local state: modifies doc.txt, adds stray.txt
    (dev2_dir / "doc.txt").write_text("Dirty local edit", encoding="utf-8")
    (dev2_dir / "stray.txt").write_text("Extra unpushed file", encoding="utf-8")

    # Hard reset
    res = pull2.hard_reset()
    assert res.pulled_version == 1
    assert res.snapshots_created >= 2  # doc.txt and stray.txt snapshotted

    # Verify stray.txt is gone and doc.txt is restored
    assert not (dev2_dir / "stray.txt").exists()
    assert (dev2_dir / "doc.txt").read_text(encoding="utf-8") == "Remote doc content"

    mgr1.close()
    mgr2.close()

