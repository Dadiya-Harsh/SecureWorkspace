"""
Secure SQLite metadata database engine for SecureWorkspace.
Implements zero-plaintext paths at rest via SecretBox(meta_key) and keyed BLAKE2b digests.
"""

from dataclasses import dataclass
from pathlib import Path
import sqlite3
import time
from typing import List, Optional

import nacl.encoding as encoding
import nacl.hash
import nacl.secret
from nacl.exceptions import CryptoError

from secureworkspace_core.constants import KEY_BYTES


def normalize_path(path: str) -> str:
    """Normalizes file path across OS boundaries (e.g. Windows '\\' -> '/')."""
    return path.replace("\\", "/").strip("/")


def compute_path_hash(path: str, meta_key: bytes) -> str:
    """
    Computes a deterministic, keyed BLAKE2b digest for indexed path lookups.
    Zero leakage of path structure to observers without meta_key.
    """
    if len(meta_key) != KEY_BYTES:
        raise ValueError(f"meta_key must be {KEY_BYTES} bytes, got {len(meta_key)}")

    norm = normalize_path(path)
    digest = nacl.hash.generichash(
        norm.encode("utf-8"),
        digest_size=32,
        key=meta_key,
        person=b"SW_PATH_",
        encoder=encoding.HexEncoder,
    )
    return digest.decode("ascii")


def encrypt_path(path: str, meta_key: bytes) -> bytes:
    """Encrypts normalized relative path with SecretBox(meta_key)."""
    if len(meta_key) != KEY_BYTES:
        raise ValueError(f"meta_key must be {KEY_BYTES} bytes, got {len(meta_key)}")

    norm = normalize_path(path)
    box = nacl.secret.SecretBox(meta_key)
    return box.encrypt(norm.encode("utf-8"))


def decrypt_path(encrypted_path: bytes, meta_key: bytes) -> str:
    """Decrypts relative path from SecretBox(meta_key)."""
    if len(meta_key) != KEY_BYTES:
        raise ValueError(f"meta_key must be {KEY_BYTES} bytes, got {len(meta_key)}")

    box = nacl.secret.SecretBox(meta_key)
    try:
        return box.decrypt(encrypted_path).decode("utf-8")
    except CryptoError:
        raise CryptoError("Failed to decrypt path: invalid key or corrupted metadata.")


@dataclass
class FileRecord:
    file_id: str
    path: str
    path_hash: str = ""
    remote_id: Optional[str] = None
    size: int = 0
    mtime_ms: int = 0
    sha256: str = ""
    sync_status: str = "NEW"  # SYNCED, NEW, MODIFIED, DELETED
    updated_at_ms: int = 0

    def __post_init__(self):
        self.path = normalize_path(self.path)
        if not self.updated_at_ms:
            self.updated_at_ms = int(time.time() * 1000)


@dataclass
class VersionRecord:
    version_number: int
    manifest_id: str
    timestamp_ms: int
    device_id: str
    message: str = ""
    file_count: int = 0


@dataclass
class SafetySnapshotRecord:
    snapshot_id: str
    timestamp_ms: int
    original_path: str
    original_path_hash: str = ""
    snapshot_path: str = ""
    size: int = 0
    sha256: str = ""
    reason: str = "pre-pull"


SCHEMA_VERSION = 1

MIGRATIONS = {
    1: [
        """
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version INTEGER PRIMARY KEY,
            applied_at_ms INTEGER NOT NULL
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS files (
            file_id TEXT PRIMARY KEY,
            path_hash TEXT NOT NULL UNIQUE,
            encrypted_path BLOB NOT NULL,
            remote_id TEXT,
            size INTEGER NOT NULL,
            mtime_ms INTEGER NOT NULL,
            sha256 TEXT NOT NULL,
            sync_status TEXT NOT NULL,
            updated_at_ms INTEGER NOT NULL
        );
        """,
        "CREATE INDEX IF NOT EXISTS idx_files_path_hash ON files(path_hash);",
        "CREATE INDEX IF NOT EXISTS idx_files_sync_status ON files(sync_status);",
        """
        CREATE TABLE IF NOT EXISTS versions (
            version_number INTEGER PRIMARY KEY,
            manifest_id TEXT NOT NULL,
            timestamp_ms INTEGER NOT NULL,
            device_id TEXT NOT NULL,
            message TEXT,
            file_count INTEGER NOT NULL
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS safety_snapshots (
            snapshot_id TEXT PRIMARY KEY,
            timestamp_ms INTEGER NOT NULL,
            original_path_hash TEXT NOT NULL,
            encrypted_original_path BLOB NOT NULL,
            snapshot_path TEXT NOT NULL,
            size INTEGER NOT NULL,
            sha256 TEXT NOT NULL,
            reason TEXT NOT NULL
        );
        """,
        "CREATE INDEX IF NOT EXISTS idx_snapshots_path_hash ON safety_snapshots(original_path_hash);",
        """
        CREATE TABLE IF NOT EXISTS workspace_state (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
        """,
    ]
}


class WorkspaceDB:
    """
    Zero-plaintext SQLite metadata database.
    File and snapshot paths are encrypted with meta_key at rest.
    """

    def __init__(self, db_path: str | Path, meta_key: bytes):
        if len(meta_key) != KEY_BYTES:
            raise ValueError(f"meta_key must be {KEY_BYTES} bytes, got {len(meta_key)}")

        self.db_path = Path(db_path)
        self.meta_key = meta_key
        self.db_path.parent.mkdir(parents=True, exist_ok=True)

        self._conn = sqlite3.connect(
            str(self.db_path),
            timeout=30.0,
            check_same_thread=False,
        )
        self._conn.row_factory = sqlite3.Row

        # Configure WAL mode and pragmas
        self._conn.execute("PRAGMA journal_mode = WAL;")
        self._conn.execute("PRAGMA synchronous = NORMAL;")
        self._conn.execute("PRAGMA foreign_keys = ON;")

        self.apply_migrations()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

    def close(self):
        if self._conn:
            self._conn.close()
            self._conn = None

    @property
    def conn(self) -> sqlite3.Connection:
        if self._conn is None:
            raise RuntimeError("Database connection is closed.")
        return self._conn

    def apply_migrations(self):
        """Applies pending migrations in transaction."""
        with self.conn:
            self.conn.execute(
                """
                CREATE TABLE IF NOT EXISTS schema_migrations (
                    version INTEGER PRIMARY KEY,
                    applied_at_ms INTEGER NOT NULL
                );
                """
            )
            cursor = self.conn.execute("SELECT MAX(version) FROM schema_migrations")
            row = cursor.fetchone()
            current_version = row[0] if (row and row[0] is not None) else 0

            for v in sorted(MIGRATIONS.keys()):
                if v > current_version:
                    for stmt in MIGRATIONS[v]:
                        self.conn.execute(stmt)
                    now_ms = int(time.time() * 1000)
                    self.conn.execute(
                        "INSERT INTO schema_migrations (version, applied_at_ms) VALUES (?, ?)",
                        (v, now_ms),
                    )

    # -------------------------------------------------------------------------
    # Files Table
    # -------------------------------------------------------------------------

    def upsert_file(self, record: FileRecord) -> None:
        """Inserts or updates a file record, encrypting the path at rest."""
        norm_path = normalize_path(record.path)
        record.path = norm_path
        path_hash = compute_path_hash(norm_path, self.meta_key)
        record.path_hash = path_hash
        enc_path = encrypt_path(norm_path, self.meta_key)

        with self.conn:
            self.conn.execute(
                """
                INSERT INTO files (
                    file_id, path_hash, encrypted_path, remote_id, size,
                    mtime_ms, sha256, sync_status, updated_at_ms
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(file_id) DO UPDATE SET
                    path_hash = excluded.path_hash,
                    encrypted_path = excluded.encrypted_path,
                    remote_id = excluded.remote_id,
                    size = excluded.size,
                    mtime_ms = excluded.mtime_ms,
                    sha256 = excluded.sha256,
                    sync_status = excluded.sync_status,
                    updated_at_ms = excluded.updated_at_ms
                """,
                (
                    record.file_id,
                    path_hash,
                    enc_path,
                    record.remote_id,
                    record.size,
                    record.mtime_ms,
                    record.sha256,
                    record.sync_status,
                    record.updated_at_ms,
                ),
            )

    def _row_to_file_record(self, row: sqlite3.Row) -> FileRecord:
        plain_path = decrypt_path(row["encrypted_path"], self.meta_key)
        return FileRecord(
            file_id=row["file_id"],
            path=plain_path,
            path_hash=row["path_hash"],
            remote_id=row["remote_id"],
            size=row["size"],
            mtime_ms=row["mtime_ms"],
            sha256=row["sha256"],
            sync_status=row["sync_status"],
            updated_at_ms=row["updated_at_ms"],
        )

    def get_file_by_id(self, file_id: str) -> Optional[FileRecord]:
        """Retrieves file record by file_id."""
        cursor = self.conn.execute(
            "SELECT * FROM files WHERE file_id = ?",
            (file_id,),
        )
        row = cursor.fetchone()
        return self._row_to_file_record(row) if row else None

    def get_file_by_path(self, path: str) -> Optional[FileRecord]:
        """Retrieves file record by relative path using keyed hash index."""
        path_hash = compute_path_hash(path, self.meta_key)
        cursor = self.conn.execute(
            "SELECT * FROM files WHERE path_hash = ?",
            (path_hash,),
        )
        row = cursor.fetchone()
        return self._row_to_file_record(row) if row else None

    def list_files(self, sync_status: Optional[str] = None) -> List[FileRecord]:
        """Lists files, optionally filtered by sync_status."""
        if sync_status:
            cursor = self.conn.execute(
                "SELECT * FROM files WHERE sync_status = ? ORDER BY file_id",
                (sync_status,),
            )
        else:
            cursor = self.conn.execute("SELECT * FROM files ORDER BY file_id")

        return [self._row_to_file_record(row) for row in cursor.fetchall()]

    def delete_file(self, file_id: str) -> bool:
        """Deletes file record completely from database."""
        with self.conn:
            cursor = self.conn.execute(
                "DELETE FROM files WHERE file_id = ?",
                (file_id,),
            )
            return cursor.rowcount > 0

    def mark_file_deleted(self, file_id: str) -> bool:
        """Marks a file as DELETED."""
        now_ms = int(time.time() * 1000)
        with self.conn:
            cursor = self.conn.execute(
                "UPDATE files SET sync_status = 'DELETED', updated_at_ms = ? WHERE file_id = ?",
                (now_ms, file_id),
            )
            return cursor.rowcount > 0

    # -------------------------------------------------------------------------
    # Versions Table
    # -------------------------------------------------------------------------

    def record_version(self, version: VersionRecord) -> None:
        """Records a version entry."""
        with self.conn:
            self.conn.execute(
                """
                INSERT OR REPLACE INTO versions (
                    version_number, manifest_id, timestamp_ms, device_id, message, file_count
                ) VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    version.version_number,
                    version.manifest_id,
                    version.timestamp_ms,
                    version.device_id,
                    version.message,
                    version.file_count,
                ),
            )

    def get_version(self, version_number: int) -> Optional[VersionRecord]:
        """Retrieves version record by version number."""
        cursor = self.conn.execute(
            "SELECT * FROM versions WHERE version_number = ?",
            (version_number,),
        )
        row = cursor.fetchone()
        if not row:
            return None
        return VersionRecord(
            version_number=row["version_number"],
            manifest_id=row["manifest_id"],
            timestamp_ms=row["timestamp_ms"],
            device_id=row["device_id"],
            message=row["message"] or "",
            file_count=row["file_count"],
        )

    def get_latest_version(self) -> Optional[VersionRecord]:
        """Retrieves highest numbered version record."""
        cursor = self.conn.execute(
            "SELECT * FROM versions ORDER BY version_number DESC LIMIT 1"
        )
        row = cursor.fetchone()
        if not row:
            return None
        return VersionRecord(
            version_number=row["version_number"],
            manifest_id=row["manifest_id"],
            timestamp_ms=row["timestamp_ms"],
            device_id=row["device_id"],
            message=row["message"] or "",
            file_count=row["file_count"],
        )

    def list_versions(self, limit: Optional[int] = None) -> List[VersionRecord]:
        """Lists versions in descending order."""
        query = "SELECT * FROM versions ORDER BY version_number DESC"
        params = ()
        if limit is not None:
            query += " LIMIT ?"
            params = (limit,)

        cursor = self.conn.execute(query, params)
        return [
            VersionRecord(
                version_number=row["version_number"],
                manifest_id=row["manifest_id"],
                timestamp_ms=row["timestamp_ms"],
                device_id=row["device_id"],
                message=row["message"] or "",
                file_count=row["file_count"],
            )
            for row in cursor.fetchall()
        ]

    # -------------------------------------------------------------------------
    # Safety Snapshots Table
    # -------------------------------------------------------------------------

    def record_snapshot(self, snapshot: SafetySnapshotRecord) -> None:
        """Records a safety snapshot."""
        norm_path = normalize_path(snapshot.original_path)
        snapshot.original_path = norm_path
        path_hash = compute_path_hash(norm_path, self.meta_key)
        snapshot.original_path_hash = path_hash
        enc_path = encrypt_path(norm_path, self.meta_key)

        with self.conn:
            self.conn.execute(
                """
                INSERT OR REPLACE INTO safety_snapshots (
                    snapshot_id, timestamp_ms, original_path_hash,
                    encrypted_original_path, snapshot_path, size, sha256, reason
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    snapshot.snapshot_id,
                    snapshot.timestamp_ms,
                    path_hash,
                    enc_path,
                    snapshot.snapshot_path,
                    snapshot.size,
                    snapshot.sha256,
                    snapshot.reason,
                ),
            )

    def _row_to_snapshot_record(self, row: sqlite3.Row) -> SafetySnapshotRecord:
        plain_path = decrypt_path(row["encrypted_original_path"], self.meta_key)
        return SafetySnapshotRecord(
            snapshot_id=row["snapshot_id"],
            timestamp_ms=row["timestamp_ms"],
            original_path=plain_path,
            original_path_hash=row["original_path_hash"],
            snapshot_path=row["snapshot_path"],
            size=row["size"],
            sha256=row["sha256"],
            reason=row["reason"],
        )

    def get_snapshot(self, snapshot_id: str) -> Optional[SafetySnapshotRecord]:
        """Retrieves snapshot record by snapshot_id."""
        cursor = self.conn.execute(
            "SELECT * FROM safety_snapshots WHERE snapshot_id = ?",
            (snapshot_id,),
        )
        row = cursor.fetchone()
        return self._row_to_snapshot_record(row) if row else None

    def list_snapshots(self) -> List[SafetySnapshotRecord]:
        """Lists all snapshots ordered by timestamp descending."""
        cursor = self.conn.execute(
            "SELECT * FROM safety_snapshots ORDER BY timestamp_ms DESC"
        )
        return [self._row_to_snapshot_record(row) for row in cursor.fetchall()]

    def delete_snapshot(self, snapshot_id: str) -> bool:
        """Deletes snapshot record."""
        with self.conn:
            cursor = self.conn.execute(
                "DELETE FROM safety_snapshots WHERE snapshot_id = ?",
                (snapshot_id,),
            )
            return cursor.rowcount > 0

    # -------------------------------------------------------------------------
    # Workspace State (Key-Value)
    # -------------------------------------------------------------------------

    def get_state(self, key: str, default: Optional[str] = None) -> Optional[str]:
        """Retrieves state string by key."""
        cursor = self.conn.execute(
            "SELECT value FROM workspace_state WHERE key = ?",
            (key,),
        )
        row = cursor.fetchone()
        return row[0] if row else default

    def set_state(self, key: str, value: str) -> None:
        """Sets state key-value string."""
        with self.conn:
            self.conn.execute(
                """
                INSERT INTO workspace_state (key, value) VALUES (?, ?)
                ON CONFLICT(key) DO UPDATE SET value = excluded.value
                """,
                (key, value),
            )

    def delete_state(self, key: str) -> bool:
        """Deletes a state key."""
        with self.conn:
            cursor = self.conn.execute(
                "DELETE FROM workspace_state WHERE key = ?",
                (key,),
            )
            return cursor.rowcount > 0
