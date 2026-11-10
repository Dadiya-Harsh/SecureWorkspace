"""
Unit tests for Database Rebuilder (rebuild.py).
Verifies reconstruction of SQLite metadata from encrypted WorkspaceCatalog (SWC1),
zero-plaintext path retention, database deletion recovery drills,
and change detector validation post-rebuild.
"""

from pathlib import Path
import pytest
import nacl.utils

from secureworkspace_core.crypto.keys import derive_meta_key, generate_wmk
from secureworkspace_core.workspace.catalog import WorkspaceCatalog, WorkspaceEntry
from secureworkspace_core.workspace.change_detector import ChangeDetector
from secureworkspace_core.workspace.db import WorkspaceDB
from secureworkspace_core.workspace.rebuild import (
    rebuild_db_from_catalog,
    rebuild_db_from_encrypted_catalog,
    rebuild_workspace_db,
)


@pytest.fixture
def wmk() -> bytes:
    return generate_wmk()


@pytest.fixture
def sample_catalog() -> WorkspaceCatalog:
    cat = WorkspaceCatalog()
    cat.add_entry(
        WorkspaceEntry(
            path="docs/architecture.pdf",
            file_id_hex="01010101010101010101010101010101",
            size=1048576,
            sha256="aaabbbccc111222333",
            mtime_ms=1700000000000,
        )
    )
    cat.add_entry(
        WorkspaceEntry(
            path="src/engine.py",
            file_id_hex="02020202020202020202020202020202",
            size=4096,
            sha256="ddddeeeeffff444555",
            mtime_ms=1700000005000,
        )
    )
    cat.add_entry(
        WorkspaceEntry(
            path="assets/logo.png",
            file_id_hex="03030303030303030303030303030303",
            size=65536,
            sha256="777888999aaabbbccc",
            mtime_ms=1700000010000,
        )
    )
    return cat


def test_rebuild_db_from_in_memory_catalog(tmp_path: Path, wmk: bytes, sample_catalog: WorkspaceCatalog):
    meta_key = derive_meta_key(wmk)
    db_path = tmp_path / "metadata.db"

    with WorkspaceDB(db_path, meta_key) as db:
        count = rebuild_db_from_catalog(sample_catalog, db, base_version=3)
        assert count == 3

        # Verify all files present with SYNCED status
        files = db.list_files()
        assert len(files) == 3
        for f in files:
            assert f.sync_status == "SYNCED"

        # Verify specific path lookups
        arch = db.get_file_by_path("docs/architecture.pdf")
        assert arch is not None
        assert arch.file_id == "01010101010101010101010101010101"
        assert arch.size == 1048576

        # Verify workspace state
        assert db.get_state("base_version") == "3"

    # Verify zero-plaintext at rest
    raw_bytes = db_path.read_bytes()
    assert b"architecture.pdf" not in raw_bytes
    assert b"engine.py" not in raw_bytes
    assert b"logo.png" not in raw_bytes


def test_rebuild_from_encrypted_catalog_ciphertext(
    tmp_path: Path, wmk: bytes, sample_catalog: WorkspaceCatalog
):
    ciphertext = sample_catalog.serialize_encrypted(wmk)
    meta_key = derive_meta_key(wmk)
    db_path = tmp_path / "rebuilt_from_enc.db"

    with WorkspaceDB(db_path, meta_key) as db:
        restored = rebuild_db_from_encrypted_catalog(
            ciphertext, wmk, db, base_version=7
        )
        assert restored == 3

        engine = db.get_file_by_path("src/engine.py")
        assert engine is not None
        assert engine.sha256 == "ddddeeeeffff444555"
        assert db.get_state("base_version") == "7"


def test_database_deletion_recovery_drill(
    tmp_path: Path, wmk: bytes, sample_catalog: WorkspaceCatalog
):
    ciphertext = sample_catalog.serialize_encrypted(wmk)
    db_path = tmp_path / "drill.db"

    # 1. Initial build
    restored1 = rebuild_workspace_db(ciphertext, wmk, db_path, base_version=10)
    assert restored1 == 3
    assert db_path.exists()

    # 2. Simulate total database corruption / deletion
    db_path.unlink()
    # Also delete WAL and SHM if present
    shm = tmp_path / "drill.db-shm"
    wal = tmp_path / "drill.db-wal"
    shm.unlink(missing_ok=True)
    wal.unlink(missing_ok=True)
    assert not db_path.exists()

    # 3. Recover database completely from encrypted catalog
    restored2 = rebuild_workspace_db(ciphertext, wmk, db_path, base_version=10)
    assert restored2 == 3
    assert db_path.exists()

    meta_key = derive_meta_key(wmk)
    with WorkspaceDB(db_path, meta_key) as db:
        logo = db.get_file_by_path("assets/logo.png")
        assert logo is not None
        assert logo.size == 65536
        assert db.get_state("base_version") == "10"


def test_post_rebuild_change_detector_sync(
    tmp_path: Path, wmk: bytes, sample_catalog: WorkspaceCatalog
):
    # Setup files on disk to match catalog entries
    workspace_dir = tmp_path / "full_workspace"
    workspace_dir.mkdir(parents=True, exist_ok=True)

    for entry in sample_catalog.list_entries():
        file_path = workspace_dir / entry.path
        file_path.parent.mkdir(parents=True, exist_ok=True)
        # Write exact dummy bytes matching entry.size
        file_path.write_bytes(b"x" * entry.size)
        # Sync mtime on disk with catalog entry
        mtime_sec = entry.mtime_ms / 1000.0
        import os
        os.utime(file_path, (mtime_sec, mtime_sec))

    ciphertext = sample_catalog.serialize_encrypted(wmk)
    db_path = workspace_dir / ".secureworkspace" / "metadata.db"

    # Rebuild database from scratch
    rebuild_workspace_db(ciphertext, wmk, db_path, base_version=1)

    # Run change detector
    meta_key = derive_meta_key(wmk)
    with WorkspaceDB(db_path, meta_key) as db:
        detector = ChangeDetector(workspace_dir, db)
        result = detector.scan()

        # All files should be cleanly SYNCED
        assert not result.has_changes
        assert len(result.synced_files) == 3
        assert len(result.new_files) == 0
        assert len(result.modified_files) == 0
        assert len(result.deleted_files) == 0
