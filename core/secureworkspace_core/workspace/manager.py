"""
Workspace layout manager, process lock, and safety snapshot controller.
Manages the <workspace>/.secureworkspace layout, process-level locking, and safety snapshots.
"""

from contextlib import contextmanager
import hashlib
import os
from pathlib import Path
import shutil
import time
from typing import Generator, List, Optional
import uuid

from secureworkspace_core.workspace.db import (
    FileRecord,
    SafetySnapshotRecord,
    WorkspaceDB,
    normalize_path,
)
from secureworkspace_core.workspace.temp_manager import TempFileManager

# Cross-platform file locking imports
try:
    import msvcrt  # Windows
    _HAS_MSVCRT = True
except ImportError:
    _HAS_MSVCRT = False

try:
    import fcntl  # POSIX / Android
    _HAS_FCNTL = True
except ImportError:
    _HAS_FCNTL = False


class WorkspaceLockedError(Exception):
    """Raised when the workspace lock cannot be acquired because another process holds it."""
    pass


class WorkspaceLock:
    """Process-level advisory lock using standard library msvcrt or fcntl."""

    def __init__(self, lock_file_path: Path):
        self.lock_file_path = lock_file_path
        self._fd: Optional[int] = None
        self._file_obj = None

    def acquire(self) -> None:
        """Acquires exclusive process lock or raises WorkspaceLockedError."""
        if self._file_obj is not None:
            return  # Already held by this instance

        self.lock_file_path.parent.mkdir(parents=True, exist_ok=True)
        # Open in read/write binary mode, create if not exists
        try:
            self._file_obj = open(self.lock_file_path, "a+b")
            self._fd = self._file_obj.fileno()

            if _HAS_MSVCRT:
                self._file_obj.seek(0)
                # Lock 1 byte non-blocking
                msvcrt.locking(self._fd, msvcrt.LK_NBLCK, 1)
            elif _HAS_FCNTL:
                fcntl.flock(self._fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
            else:
                # Fallback if neither available (should never happen on supported platforms)
                pass
        except (BlockingIOError, PermissionError, OSError) as e:
            self.release()
            raise WorkspaceLockedError(
                f"Workspace is currently locked by another process: {self.lock_file_path}"
            ) from e

    def release(self) -> None:
        """Releases process lock if held."""
        if self._file_obj is not None:
            try:
                if self._fd is not None:
                    if _HAS_MSVCRT:
                        self._file_obj.seek(0)
                        try:
                            msvcrt.locking(self._fd, msvcrt.LK_UNLCK, 1)
                        except OSError:
                            pass
                    elif _HAS_FCNTL:
                        try:
                            fcntl.flock(self._fd, fcntl.LOCK_UN)
                        except OSError:
                            pass
            finally:
                try:
                    self._file_obj.close()
                except OSError:
                    pass
                self._file_obj = None
                self._fd = None

    def __enter__(self):
        self.acquire()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.release()


class WorkspaceManager:
    """
    Manages <workspace>/.secureworkspace directory structure, locks,
    safety snapshots, and temp staging files.
    """

    DOT_DIR_NAME = ".secureworkspace"

    def __init__(self, workspace_root: str | Path, meta_key: Optional[bytes] = None):
        self.root_path = Path(workspace_root).resolve()
        self.dot_dir = self.root_path / self.DOT_DIR_NAME
        self.db_path = self.dot_dir / "metadata.db"
        self.lock_path = self.dot_dir / "lock"
        self.snapshots_dir = self.dot_dir / "snapshots"
        self.temp_dir = self.dot_dir / "temp"

        self._meta_key = meta_key
        self._db: Optional[WorkspaceDB] = None
        self._temp_manager: Optional[TempFileManager] = None
        self._lock = WorkspaceLock(self.lock_path)

    @classmethod
    def is_workspace(cls, workspace_root: str | Path) -> bool:
        """Returns True if the directory is an initialized SecureWorkspace."""
        root = Path(workspace_root).resolve()
        dot_dir = root / cls.DOT_DIR_NAME
        db_file = dot_dir / "metadata.db"
        header_file = root / "workspace.header"
        return dot_dir.is_dir() and (db_file.is_file() or header_file.is_file())

    def init_workspace(self) -> None:
        """
        Initializes the workspace layout:
        Creates .secureworkspace, snapshots/, temp/, and cleans leftover crash files.
        """
        self.root_path.mkdir(parents=True, exist_ok=True)
        self.dot_dir.mkdir(parents=True, exist_ok=True)
        self.snapshots_dir.mkdir(parents=True, exist_ok=True)
        self.temp_dir.mkdir(parents=True, exist_ok=True)

        # Initialize temp manager and wipe any crash remnants
        self.temp_manager.cleanup_all()

        # Initialize database if meta_key provided
        if self._meta_key is not None:
            _ = self.db

    @property
    def db(self) -> WorkspaceDB:
        """Lazily opens WorkspaceDB."""
        if self._db is None:
            if self._meta_key is None:
                raise ValueError("Cannot access db: meta_key was not provided to WorkspaceManager.")
            self._db = WorkspaceDB(self.db_path, self._meta_key)
        return self._db

    @property
    def temp_manager(self) -> TempFileManager:
        """Lazily creates TempFileManager."""
        if self._temp_manager is None:
            self._temp_manager = TempFileManager(self.temp_dir)
        return self._temp_manager

    @contextmanager
    def acquire_lock(self) -> Generator["WorkspaceManager", None, None]:
        """Context manager to hold exclusive workspace lock."""
        with self._lock:
            yield self

    def lock(self) -> None:
        """Acquires the exclusive workspace lock."""
        self._lock.acquire()

    def unlock(self) -> None:
        """Releases the exclusive workspace lock."""
        self._lock.release()

    def close(self) -> None:
        """Releases lock and closes database connection."""
        self.unlock()
        if self._db is not None:
            self._db.close()
            self._db = None

    # -------------------------------------------------------------------------
    # Safety Snapshots
    # -------------------------------------------------------------------------

    def create_safety_snapshot(
        self, relative_path: str, reason: str = "pre-pull"
    ) -> SafetySnapshotRecord:
        """
        Creates a safety snapshot of a local workspace file before pulling or reverting.
        Stores snapshot file in .secureworkspace/snapshots/ and metadata in SQLite.
        """
        norm_path = normalize_path(relative_path)
        source_file = self.root_path / norm_path

        if not source_file.is_file():
            raise FileNotFoundError(f"File to snapshot does not exist: {source_file}")

        # Compute hash and size
        hasher = hashlib.sha256()
        size = 0
        with open(source_file, "rb") as f:
            while chunk := f.read(64 * 1024):
                hasher.update(chunk)
                size += len(chunk)

        sha256 = hasher.hexdigest()
        now_ms = int(time.time() * 1000)
        random_id = uuid.uuid4().hex[:12]
        snapshot_id = f"snap_{random_id}_{now_ms}"
        snapshot_filename = f"{snapshot_id}.snap"
        dest_path = self.snapshots_dir / snapshot_filename

        self.snapshots_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source_file, dest_path)

        record = SafetySnapshotRecord(
            snapshot_id=snapshot_id,
            timestamp_ms=now_ms,
            original_path=norm_path,
            snapshot_path=snapshot_filename,
            size=size,
            sha256=sha256,
            reason=reason,
        )

        self.db.record_snapshot(record)
        return record

    def restore_safety_snapshot(self, snapshot_id: str) -> Path:
        """
        Restores a safety snapshot back to its original location in the workspace.
        Validates SHA-256 before restoring.
        """
        snap = self.db.get_snapshot(snapshot_id)
        if snap is None:
            raise ValueError(f"Snapshot record not found for id: {snapshot_id}")

        snap_file = self.snapshots_dir / snap.snapshot_path
        if not snap_file.is_file():
            raise FileNotFoundError(f"Snapshot physical file missing: {snap_file}")

        # Validate snapshot integrity
        hasher = hashlib.sha256()
        with open(snap_file, "rb") as f:
            while chunk := f.read(64 * 1024):
                hasher.update(chunk)

        if hasher.hexdigest() != snap.sha256:
            raise ValueError(
                f"Snapshot file integrity verification failed: expected {snap.sha256}, got {hasher.hexdigest()}"
            )

        target_file = self.root_path / snap.original_path
        target_file.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(snap_file, target_file)
        return target_file

    def list_safety_snapshots(self) -> List[SafetySnapshotRecord]:
        """Lists all safety snapshots."""
        return self.db.list_snapshots()

    def delete_safety_snapshot(self, snapshot_id: str) -> bool:
        """Deletes snapshot file and database record."""
        snap = self.db.get_snapshot(snapshot_id)
        if snap:
            snap_file = self.snapshots_dir / snap.snapshot_path
            snap_file.unlink(missing_ok=True)
            return self.db.delete_snapshot(snapshot_id)
        return False

    def prune_safety_snapshots(self, retention_days: int = 90) -> int:
        """
        Prunes safety snapshots older than retention_days.
        Returns count of pruned snapshots.
        """
        cutoff_ms = int(time.time() * 1000) - (retention_days * 86400 * 1000)
        all_snaps = self.list_safety_snapshots()
        pruned = 0
        for snap in all_snaps:
            if snap.timestamp_ms < cutoff_ms:
                if self.delete_safety_snapshot(snap.snapshot_id):
                    pruned += 1
        return pruned
