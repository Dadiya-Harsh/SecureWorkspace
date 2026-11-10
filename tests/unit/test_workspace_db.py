"""
Unit tests for Secure SQLite metadata engine (WorkspaceDB).
Verifies zero-plaintext path encryption at rest, WAL mode, migrations, and CRUD operations.
"""

from pathlib import Path
import sqlite3
import pytest
import nacl.utils
from nacl.exceptions import CryptoError

from secureworkspace_core.workspace.db import (
    FileRecord,
    SafetySnapshotRecord,
    VersionRecord,
    WorkspaceDB,
    compute_path_hash,
    normalize_path,
)


@pytest.fixture
def meta_key() -> bytes:
    return nacl.utils.random(32)


@pytest.fixture
def temp_db_path(tmp_path: Path) -> Path:
    return tmp_path / "test_metadata.db"


def test_db_initialization_and_wal_mode(temp_db_path: Path, meta_key: bytes):
    with WorkspaceDB(temp_db_path, meta_key) as db:
        cursor = db.conn.execute("PRAGMA journal_mode;")
        mode = cursor.fetchone()[0]
        assert mode.lower() == "wal"

        cursor = db.conn.execute("PRAGMA foreign_keys;")
        fk = cursor.fetchone()[0]
        assert fk == 1

        # Verify migrations recorded
        cursor = db.conn.execute("SELECT MAX(version) FROM schema_migrations;")
        version = cursor.fetchone()[0]
        assert version == 1


def test_zero_plaintext_paths_at_rest(temp_db_path: Path, meta_key: bytes):
    sensitive_path = "confidential/payroll/executive_bonuses_2026.xlsx"
    file_id = "0123456789abcdef0123456789abcdef"

    # 1. Insert record into database
    with WorkspaceDB(temp_db_path, meta_key) as db:
        record = FileRecord(
            file_id=file_id,
            path=sensitive_path,
            size=1024,
            mtime_ms=1700000000000,
            sha256="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            sync_status="SYNCED",
        )
        db.upsert_file(record)

    # 2. Inspect raw SQLite file bytes from disk
    raw_db_bytes = temp_db_path.read_bytes()

    # Assert that sensitive tokens do NOT appear anywhere in the database file at rest
    assert b"executive_bonuses" not in raw_db_bytes
    assert b"payroll" not in raw_db_bytes
    assert b"confidential" not in raw_db_bytes
    assert sensitive_path.encode("utf-8") not in raw_db_bytes

    # 3. Direct raw SQL inspection
    raw_conn = sqlite3.connect(str(temp_db_path))
    raw_cursor = raw_conn.execute("SELECT path_hash, encrypted_path FROM files WHERE file_id = ?", (file_id,))
    row = raw_cursor.fetchone()
    raw_conn.close()

    assert row is not None
    path_hash, encrypted_path = row[0], row[1]
    assert path_hash == compute_path_hash(sensitive_path, meta_key)
    assert b"executive_bonuses" not in encrypted_path

    # 4. Read back through WorkspaceDB with correct key
    with WorkspaceDB(temp_db_path, meta_key) as db:
        loaded = db.get_file_by_id(file_id)
        assert loaded is not None
        assert loaded.path == sensitive_path
        assert loaded.file_id == file_id

        # Lookup by path
        by_path = db.get_file_by_path(sensitive_path)
        assert by_path is not None
        assert by_path.file_id == file_id

        # Lookup with Windows backslashes
        by_win_path = db.get_file_by_path("confidential\\payroll\\executive_bonuses_2026.xlsx")
        assert by_win_path is not None
        assert by_win_path.file_id == file_id

    # 5. Read back through WorkspaceDB with wrong key fails decryption
    wrong_key = nacl.utils.random(32)
    with WorkspaceDB(temp_db_path, wrong_key) as bad_db:
        with pytest.raises(CryptoError, match="Failed to decrypt path"):
            bad_db.get_file_by_id(file_id)


def test_file_crud_operations(temp_db_path: Path, meta_key: bytes):
    with WorkspaceDB(temp_db_path, meta_key) as db:
        f1 = FileRecord(
            file_id="id_001",
            path="docs/readme.md",
            size=500,
            mtime_ms=1000,
            sha256="hash1",
            sync_status="NEW",
        )
        f2 = FileRecord(
            file_id="id_002",
            path="src/main.py",
            size=1200,
            mtime_ms=2000,
            sha256="hash2",
            sync_status="SYNCED",
        )
        db.upsert_file(f1)
        db.upsert_file(f2)

        # List all
        all_files = db.list_files()
        assert len(all_files) == 2
        paths = {f.path for f in all_files}
        assert paths == {"docs/readme.md", "src/main.py"}

        # Filter by status
        new_files = db.list_files(sync_status="NEW")
        assert len(new_files) == 1
        assert new_files[0].path == "docs/readme.md"

        synced_files = db.list_files(sync_status="SYNCED")
        assert len(synced_files) == 1
        assert synced_files[0].path == "src/main.py"

        # Update file
        f1.sync_status = "SYNCED"
        f1.size = 550
        db.upsert_file(f1)
        updated = db.get_file_by_id("id_001")
        assert updated is not None
        assert updated.sync_status == "SYNCED"
        assert updated.size == 550

        # Mark deleted
        assert db.mark_file_deleted("id_001") is True
        marked = db.get_file_by_id("id_001")
        assert marked.sync_status == "DELETED"

        # Hard delete
        assert db.delete_file("id_001") is True
        assert db.get_file_by_id("id_001") is None
        assert len(db.list_files()) == 1


def test_versions_crud(temp_db_path: Path, meta_key: bytes):
    with WorkspaceDB(temp_db_path, meta_key) as db:
        assert db.get_latest_version() is None
        assert len(db.list_versions()) == 0

        v1 = VersionRecord(
            version_number=1,
            manifest_id="man_001",
            timestamp_ms=100000,
            device_id="desktop_win11",
            message="Initial commit",
            file_count=5,
        )
        v2 = VersionRecord(
            version_number=2,
            manifest_id="man_002",
            timestamp_ms=200000,
            device_id="desktop_win11",
            message="Added financial docs",
            file_count=8,
        )
        db.record_version(v1)
        db.record_version(v2)

        latest = db.get_latest_version()
        assert latest is not None
        assert latest.version_number == 2
        assert latest.message == "Added financial docs"

        got_v1 = db.get_version(1)
        assert got_v1 is not None
        assert got_v1.manifest_id == "man_001"

        history = db.list_versions(limit=1)
        assert len(history) == 1
        assert history[0].version_number == 2


def test_safety_snapshots_crud(temp_db_path: Path, meta_key: bytes):
    with WorkspaceDB(temp_db_path, meta_key) as db:
        snap1 = SafetySnapshotRecord(
            snapshot_id="snap_01",
            timestamp_ms=1000,
            original_path="secret/passwords.txt",
            snapshot_path="snap_01.snap",
            size=128,
            sha256="abc123hash",
            reason="pre-pull",
        )
        snap2 = SafetySnapshotRecord(
            snapshot_id="snap_02",
            timestamp_ms=2000,
            original_path="docs/draft.docx",
            snapshot_path="snap_02.snap",
            size=2048,
            sha256="def456hash",
            reason="pre-revert",
        )
        db.record_snapshot(snap1)
        db.record_snapshot(snap2)

        snaps = db.list_snapshots()
        assert len(snaps) == 2
        # Ordered by timestamp desc
        assert snaps[0].snapshot_id == "snap_02"
        assert snaps[1].snapshot_id == "snap_01"
        assert snaps[1].original_path == "secret/passwords.txt"

        # Check raw DB has zero plaintext path for snapshots too
        raw_db = temp_db_path.read_bytes()
        assert b"passwords.txt" not in raw_db

        retrieved = db.get_snapshot("snap_01")
        assert retrieved is not None
        assert retrieved.sha256 == "abc123hash"

        assert db.delete_snapshot("snap_01") is True
        assert db.get_snapshot("snap_01") is None
        assert len(db.list_snapshots()) == 1


def test_workspace_state(temp_db_path: Path, meta_key: bytes):
    with WorkspaceDB(temp_db_path, meta_key) as db:
        assert db.get_state("base_version") is None
        assert db.get_state("base_version", default="0") == "0"

        db.set_state("base_version", "42")
        assert db.get_state("base_version") == "42"

        db.set_state("device_id", "dev_pixel8_arm64")
        assert db.get_state("device_id") == "dev_pixel8_arm64"

        # Update existing
        db.set_state("base_version", "43")
        assert db.get_state("base_version") == "43"

        assert db.delete_state("device_id") is True
        assert db.get_state("device_id") is None
