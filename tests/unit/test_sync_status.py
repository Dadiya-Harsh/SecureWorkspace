"""
Unit tests for StatusEngine and SyncStatus.
Tests detection of local unpushed changes, remote Drive versions ahead,
and diverged states according to PRD Sections 7, 8 (FR-04), and 14.
"""

from pathlib import Path
import pytest
import nacl.utils

from secureworkspace_core.crypto.keys import derive_meta_key, generate_wmk
from secureworkspace_core.storage.mock import MockStorageAdapter
from secureworkspace_core.sync.manifest import (
    RemoteManifestManager,
    VersionManifest,
)
from secureworkspace_core.sync.status import StatusEngine, SyncStatus
from secureworkspace_core.workspace.catalog import WorkspaceEntry
from secureworkspace_core.workspace.manager import WorkspaceManager


@pytest.fixture
def wmk() -> bytes:
    return generate_wmk()


@pytest.fixture
def sync_env(tmp_path: Path, wmk: bytes):
    meta_key = derive_meta_key(wmk)
    ws_dir = tmp_path / "workspace"
    manager = WorkspaceManager(ws_dir, meta_key=meta_key)
    manager.init_workspace()

    storage = MockStorageAdapter()
    manifest_mgr = RemoteManifestManager(storage, wmk)
    status_engine = StatusEngine(manager, manifest_mgr)

    yield manager, manifest_mgr, status_engine
    manager.close()


def test_status_clean_workspace(sync_env):
    manager, manifest_mgr, status_engine = sync_env

    status = status_engine.status()
    assert status.base_version == 0
    assert status.remote_head == 0
    assert status.versions_ahead == 0
    assert not status.has_local_changes
    assert not status.is_diverged
    assert status.is_up_to_date


def test_status_local_changes_only(sync_env):
    manager, manifest_mgr, status_engine = sync_env

    # Add a local file
    f = manager.root_path / "notes.txt"
    f.write_text("Local unpushed note", encoding="utf-8")

    status = status_engine.status()
    assert status.base_version == 0
    assert status.remote_head == 0
    assert status.versions_ahead == 0
    assert status.has_local_changes
    assert status.total_local_changes == 1
    assert not status.is_diverged
    assert not status.is_up_to_date


def test_status_remote_ahead_only(sync_env):
    manager, manifest_mgr, status_engine = sync_env

    # Advance remote HEAD to 3
    manifest_mgr.update_remote_head(new_version=3)

    status = status_engine.status()
    assert status.base_version == 0
    assert status.remote_head == 3
    assert status.versions_ahead == 3
    assert not status.has_local_changes
    assert not status.is_diverged
    assert not status.is_up_to_date


def test_status_diverged_state(sync_env):
    manager, manifest_mgr, status_engine = sync_env

    # 1. Local changes present
    f = manager.root_path / "unpushed.txt"
    f.write_text("Unpushed local content", encoding="utf-8")

    # 2. Remote HEAD is ahead of local base_version
    manifest_mgr.update_remote_head(new_version=2)

    status = status_engine.status()
    assert status.base_version == 0
    assert status.remote_head == 2
    assert status.versions_ahead == 2
    assert status.has_local_changes
    # Both sides changed -> DIVERGED!
    assert status.is_diverged
    assert not status.is_up_to_date

    # Verify JSON output structure
    d = status.to_dict()
    assert d["base_version"] == 0
    assert d["remote_head"] == 2
    assert d["versions_ahead"] == 2
    assert d["is_diverged"] is True
    assert len(d["changes"]["new"]) == 1
    assert d["changes"]["new"][0]["path"] == "unpushed.txt"
