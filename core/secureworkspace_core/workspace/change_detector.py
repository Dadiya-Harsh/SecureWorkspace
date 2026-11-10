"""
Change detection engine for SecureWorkspace.
Performs fast (size, mtime) checks with streaming SHA-256 fallback to detect
SYNCED, NEW, MODIFIED, and DELETED files against SQLite metadata.
"""

from dataclasses import dataclass, field
import fnmatch
import hashlib
import os
from pathlib import Path
from typing import List, Optional, Set

from secureworkspace_core.workspace.db import FileRecord, WorkspaceDB, normalize_path

DEFAULT_IGNORE_PATTERNS = [
    ".secureworkspace",
    ".secureworkspace/*",
    ".secureworkspace/**",
    ".git",
    ".git/*",
    ".git/**",
    ".venv",
    ".venv/*",
    ".venv/**",
    "__pycache__",
    "__pycache__/*",
    "__pycache__/**",
    "*.pyc",
    "Thumbs.db",
    ".DS_Store",
    "desktop.ini",
    "*.swp",
    "*~",
]


@dataclass
class FileChange:
    path: str
    status: str  # "SYNCED", "NEW", "MODIFIED", "DELETED"
    size: int = 0
    mtime_ms: int = 0
    sha256: Optional[str] = None
    file_id: Optional[str] = None


@dataclass
class ChangeDetectionResult:
    new_files: List[FileChange] = field(default_factory=list)
    modified_files: List[FileChange] = field(default_factory=list)
    deleted_files: List[FileChange] = field(default_factory=list)
    synced_files: List[FileChange] = field(default_factory=list)

    @property
    def has_changes(self) -> bool:
        return bool(self.new_files or self.modified_files or self.deleted_files)

    @property
    def total_changes(self) -> int:
        return len(self.new_files) + len(self.modified_files) + len(self.deleted_files)


def compute_file_sha256(path: Path) -> str:
    """Computes SHA-256 digest of a file in 64 KB chunks to bound memory use."""
    hasher = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(64 * 1024):
            hasher.update(chunk)
    return hasher.hexdigest()


class ChangeDetector:
    """
    Scans a workspace root directory and compares it against the SQLite metadata database.
    """

    def __init__(
        self,
        workspace_root: str | Path,
        db: WorkspaceDB,
        ignore_patterns: Optional[List[str]] = None,
    ):
        self.workspace_root = Path(workspace_root).resolve()
        self.db = db
        self.ignore_patterns = list(DEFAULT_IGNORE_PATTERNS)
        if ignore_patterns:
            self.ignore_patterns.extend(ignore_patterns)

    def is_ignored(self, relative_path: str, is_dir: bool = False) -> bool:
        """Determines whether a relative path matches any ignore patterns."""
        norm_path = normalize_path(relative_path)
        if not norm_path:
            return False

        parts = norm_path.split("/")
        basename = parts[-1]

        for pat in self.ignore_patterns:
            clean_pat = pat.replace("\\", "/").rstrip("/")

            # Direct match on path or basename
            if fnmatch.fnmatch(norm_path, clean_pat) or fnmatch.fnmatch(basename, clean_pat):
                return True

            # Match on directory segments
            for part in parts:
                if fnmatch.fnmatch(part, clean_pat):
                    return True

            # Recursive wildcard patterns (e.g. .git/**)
            if clean_pat.endswith("/**"):
                base_dir = clean_pat[:-3]
                if norm_path == base_dir or norm_path.startswith(base_dir + "/"):
                    return True
            elif clean_pat.endswith("/*"):
                base_dir = clean_pat[:-2]
                if norm_path == base_dir or norm_path.startswith(base_dir + "/"):
                    return True

        return False

    def scan(self, quick: bool = False) -> ChangeDetectionResult:
        """
        Scans workspace directory, compares with DB, and categorizes files.
        If quick=True, skips SHA-256 calculation for changed mtimes.
        """
        result = ChangeDetectionResult()
        scanned_paths: Set[str] = set()

        # 1. Walk workspace on disk
        for root, dirs, files in os.walk(self.workspace_root):
            rel_root = os.path.relpath(root, self.workspace_root)
            norm_rel_root = "" if rel_root == "." else normalize_path(rel_root)

            # Prune ignored directories in-place for efficiency
            dirs[:] = [
                d
                for d in dirs
                if not self.is_ignored(
                    f"{norm_rel_root}/{d}" if norm_rel_root else d, is_dir=True
                )
            ]

            for fname in files:
                rel_path = f"{norm_rel_root}/{fname}" if norm_rel_root else fname
                rel_path = normalize_path(rel_path)

                if self.is_ignored(rel_path, is_dir=False):
                    continue

                full_path = self.workspace_root / rel_path
                try:
                    stat = full_path.stat()
                except OSError:
                    continue  # File might have been removed concurrently

                disk_size = stat.st_size
                disk_mtime_ms = int(stat.st_mtime * 1000)
                scanned_paths.add(rel_path)

                # Check SQLite database for this path
                db_record = self.db.get_file_by_path(rel_path)

                if db_record is None or db_record.sync_status == "DELETED":
                    # File is NEW
                    sha256 = None if quick else compute_file_sha256(full_path)
                    result.new_files.append(
                        FileChange(
                            path=rel_path,
                            status="NEW",
                            size=disk_size,
                            mtime_ms=disk_mtime_ms,
                            sha256=sha256,
                            file_id=db_record.file_id if db_record else None,
                        )
                    )
                else:
                    # File exists in DB: check if SYNCED or MODIFIED
                    # Fast check: size & mtime match
                    if disk_size == db_record.size and disk_mtime_ms == db_record.mtime_ms:
                        result.synced_files.append(
                            FileChange(
                                path=rel_path,
                                status="SYNCED",
                                size=disk_size,
                                mtime_ms=disk_mtime_ms,
                                sha256=db_record.sha256,
                                file_id=db_record.file_id,
                            )
                        )
                    elif disk_size != db_record.size:
                        # Size changed: definitely modified
                        sha256 = None if quick else compute_file_sha256(full_path)
                        result.modified_files.append(
                            FileChange(
                                path=rel_path,
                                status="MODIFIED",
                                size=disk_size,
                                mtime_ms=disk_mtime_ms,
                                sha256=sha256,
                                file_id=db_record.file_id,
                            )
                        )
                    else:
                        # Size is identical but mtime changed: verify content hash
                        if quick:
                            result.modified_files.append(
                                FileChange(
                                    path=rel_path,
                                    status="MODIFIED",
                                    size=disk_size,
                                    mtime_ms=disk_mtime_ms,
                                    file_id=db_record.file_id,
                                )
                            )
                        else:
                            content_sha256 = compute_file_sha256(full_path)
                            if content_sha256 == db_record.sha256:
                                # Content unchanged, mtime was just touched
                                result.synced_files.append(
                                    FileChange(
                                        path=rel_path,
                                        status="SYNCED",
                                        size=disk_size,
                                        mtime_ms=disk_mtime_ms,
                                        sha256=content_sha256,
                                        file_id=db_record.file_id,
                                    )
                                )
                            else:
                                result.modified_files.append(
                                    FileChange(
                                        path=rel_path,
                                        status="MODIFIED",
                                        size=disk_size,
                                        mtime_ms=disk_mtime_ms,
                                        sha256=content_sha256,
                                        file_id=db_record.file_id,
                                    )
                                )

        # 2. Check for DELETED files (files in DB with status != DELETED but not found on disk)
        all_db_files = self.db.list_files()
        for record in all_db_files:
            if record.sync_status != "DELETED" and record.path not in scanned_paths:
                result.deleted_files.append(
                    FileChange(
                        path=record.path,
                        status="DELETED",
                        size=record.size,
                        mtime_ms=record.mtime_ms,
                        sha256=record.sha256,
                        file_id=record.file_id,
                    )
                )

        return result
