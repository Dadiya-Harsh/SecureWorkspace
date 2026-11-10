"""
Force Push and Revert operations for SecureWorkspace.
Implements force_push, whole-workspace version revert, and single-file historical restoration.
"""

from dataclasses import dataclass
import os
from pathlib import Path
from typing import List, Optional
import uuid

from secureworkspace_core.sync.manifest import RemoteManifestManager, VersionManifest
from secureworkspace_core.sync.push import PushEngine, PushResult
from secureworkspace_core.workspace.catalog import WorkspaceEntry
from secureworkspace_core.workspace.change_detector import ChangeDetector
from secureworkspace_core.workspace.db import FileRecord, normalize_path
from secureworkspace_core.workspace.file_ops import decrypt_file
from secureworkspace_core.workspace.manager import WorkspaceManager


@dataclass
class RevertResult:
    reverted_to_version: int
    files_restored: int
    files_deleted: int
    snapshots_created: int
    message: str


def force_push(
    push_engine: PushEngine,
    message: str = "Force push",
    confirm: bool = False,
    device_id: str = "desktop",
) -> PushResult:
    """
    Forces the local workspace state to become the new latest version in Drive,
    even if Drive has newer versions ahead of the local base version.
    Older versions in Drive remain intact in versions/ history.
    """
    if not confirm:
        raise ValueError("force_push requires explicit confirm=True.")

    # Temporarily bypass base_version check by aligning local base_version in DB to remote HEAD
    remote_head = push_engine.manifest_manager.get_remote_head()
    push_engine.manager.db.set_state("base_version", str(remote_head))

    # Perform normal push on top of remote_head
    return push_engine.push(
        message=f"[FORCE PUSH] {message}".strip(),
        confirm_mass_deletion=True,
        device_id=device_id,
    )


def revert_workspace(
    version_number: int,
    manager: WorkspaceManager,
    manifest_manager: RemoteManifestManager,
    confirm: bool = True,
) -> RevertResult:
    """
    Loads an earlier Drive version as active local state.
    Files are restored and marked as unpushed local changes so they can be pushed as a new version.
    """
    if not confirm:
        raise ValueError("revert requires explicit confirm=True.")

    manifest = manifest_manager.get_manifest(version_number)
    target_entries_by_path = {normalize_path(e.path): e for e in manifest.entries}

    # 1. Create safety snapshots for all current local files before altering
    detector = ChangeDetector(manager.root_path, manager.db)
    scan_res = detector.scan()
    all_current_files = scan_res.synced_files + scan_res.new_files + scan_res.modified_files

    snapshots_created = 0
    for f in all_current_files:
        norm = normalize_path(f.path)
        local_file = manager.root_path / norm
        if local_file.is_file():
            manager.create_safety_snapshot(norm, reason=f"pre-revert-to-v{version_number}")
            snapshots_created += 1

    # 2. Download and decrypt objects from target version
    files_restored = 0
    for norm_path, entry in target_entries_by_path.items():
        dest_path = manager.root_path / norm_path
        dest_path.parent.mkdir(parents=True, exist_ok=True)

        with manager.temp_manager.temp_file(suffix=".enc") as temp_enc:
            manifest_manager.download_object(entry.file_id_hex, str(temp_enc))
            file_id_bytes = bytes.fromhex(entry.file_id_hex)
            dec_sha256 = decrypt_file(
                input_path=str(temp_enc),
                output_path=str(dest_path),
                wmk=manifest_manager.wmk,
                file_id=file_id_bytes,
            )
            if dec_sha256 != entry.sha256:
                raise ValueError(
                    f"Integrity check failed during revert for {entry.path}: "
                    f"expected {entry.sha256}, got {dec_sha256}"
                )

        if entry.mtime_ms > 0:
            mtime_sec = entry.mtime_ms / 1000.0
            try:
                os.utime(dest_path, (mtime_sec, mtime_sec))
            except OSError:
                pass

        files_restored += 1

    # 3. Delete files not present in target version
    files_deleted = 0
    for f in all_current_files:
        norm = normalize_path(f.path)
        if norm not in target_entries_by_path:
            local_file = manager.root_path / norm
            if local_file.is_file():
                try:
                    local_file.unlink(missing_ok=True)
                    files_deleted += 1
                except OSError:
                    pass

    # 4. Update SQLite database: mark all files as MODIFIED unpushed changes
    for norm_path, entry in target_entries_by_path.items():
        manager.db.upsert_file(
            FileRecord(
                file_id=entry.file_id_hex,
                path=entry.path,
                size=entry.size,
                mtime_ms=entry.mtime_ms,
                sha256=entry.sha256,
                sync_status="MODIFIED",
            )
        )

    return RevertResult(
        reverted_to_version=version_number,
        files_restored=files_restored,
        files_deleted=files_deleted,
        snapshots_created=snapshots_created,
        message=f"Reverted workspace to version {version_number} (staged as unpushed change).",
    )


def restore_file_version(
    relative_path: str,
    version_number: int,
    manager: WorkspaceManager,
    manifest_manager: RemoteManifestManager,
) -> Path:
    """
    Restores a single file from a historical Drive version into the workspace.
    Saves the existing file to a safety snapshot and marks the restored file as MODIFIED.
    """
    manifest = manifest_manager.get_manifest(version_number)
    entry = manifest.get_entry_by_path(relative_path)
    if not entry:
        raise FileNotFoundError(
            f"File '{relative_path}' does not exist in version {version_number}."
        )

    norm_path = normalize_path(relative_path)
    target_path = manager.root_path / norm_path
    if target_path.is_file():
        manager.create_safety_snapshot(
            norm_path, reason=f"pre-restore-file-v{version_number}"
        )

    target_path.parent.mkdir(parents=True, exist_ok=True)
    with manager.temp_manager.temp_file(suffix=".enc") as temp_enc:
        manifest_manager.download_object(entry.file_id_hex, str(temp_enc))
        file_id_bytes = bytes.fromhex(entry.file_id_hex)
        dec_sha256 = decrypt_file(
            input_path=str(temp_enc),
            output_path=str(target_path),
            wmk=manifest_manager.wmk,
            file_id=file_id_bytes,
        )
        if dec_sha256 != entry.sha256:
            raise ValueError(
                f"Integrity check failed: expected {entry.sha256}, got {dec_sha256}"
            )

    manager.db.upsert_file(
        FileRecord(
            file_id=entry.file_id_hex,
            path=entry.path,
            size=entry.size,
            mtime_ms=entry.mtime_ms,
            sha256=entry.sha256,
            sync_status="MODIFIED",
        )
    )
    return target_path
