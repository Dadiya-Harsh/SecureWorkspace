"""
Pull engine for SecureWorkspace.
Implements pull_preview and pull(confirm):
Stages downloads, creates local safety snapshots of unpushed/modified files,
decrypts objects, and updates local metadata to match remote HEAD.
"""

from dataclasses import asdict, dataclass, field
import os
from pathlib import Path
from typing import Any, Dict, List, Optional
import uuid

from secureworkspace_core.sync.errors import DivergedWorkspaceError
from secureworkspace_core.sync.manifest import RemoteManifestManager, VersionManifest
from secureworkspace_core.workspace.catalog import WorkspaceCatalog, WorkspaceEntry
from secureworkspace_core.workspace.change_detector import ChangeDetector, compute_file_sha256
from secureworkspace_core.workspace.db import FileRecord, normalize_path
from secureworkspace_core.workspace.file_ops import decrypt_file
from secureworkspace_core.workspace.manager import WorkspaceManager
from secureworkspace_core.workspace.rebuild import rebuild_db_from_catalog


@dataclass
class PullPreview:
    remote_head: int
    files_to_download: List[WorkspaceEntry] = field(default_factory=list)
    files_to_delete: List[str] = field(default_factory=list)
    files_to_snapshot: List[str] = field(default_factory=list)
    conflicting_files: List[str] = field(default_factory=list)
    is_up_to_date: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "remote_head": self.remote_head,
            "is_up_to_date": self.is_up_to_date,
            "download_count": len(self.files_to_download),
            "delete_count": len(self.files_to_delete),
            "snapshot_count": len(self.files_to_snapshot),
            "conflict_count": len(self.conflicting_files),
            "has_conflicts": len(self.conflicting_files) > 0,
            "conflicting_files": self.conflicting_files,
            "files_to_download": [asdict(e) for e in self.files_to_download],
            "files_to_delete": self.files_to_delete,
            "files_to_snapshot": self.files_to_snapshot,
        }


@dataclass
class PullResult:
    pulled_version: int
    files_downloaded: int
    files_deleted: int
    snapshots_created: int
    message: str = "Pull completed successfully."


class PullEngine:
    """Coordinates pull previews and atomic execution with safety snapshots."""

    def __init__(
        self,
        manager: WorkspaceManager,
        manifest_manager: RemoteManifestManager,
        ignore_patterns: Optional[List[str]] = None,
    ):
        self.manager = manager
        self.manifest_manager = manifest_manager
        self.ignore_patterns = ignore_patterns

    def pull_preview(self) -> PullPreview:
        """
        Calculates differences between local workspace and remote HEAD manifest.
        Does not modify files. Non-destructive: preserves local unpushed files and detects conflicts.
        """
        remote_head = self.manifest_manager.get_remote_head()
        if remote_head == 0:
            return PullPreview(remote_head=0, is_up_to_date=True)

        remote_manifest = self.manifest_manager.get_manifest(remote_head)
        remote_by_path: Dict[str, WorkspaceEntry] = {
            normalize_path(e.path): e for e in remote_manifest.entries
        }

        # Scan local changes to identify what local files have unpushed changes
        detector = ChangeDetector(
            self.manager.root_path, self.manager.db, self.ignore_patterns
        )
        local_changes = detector.scan()
        unpushed_paths = {
            normalize_path(c.path)
            for c in local_changes.new_files + local_changes.modified_files
        }
        for db_file in self.manager.db.list_files():
            if db_file.sync_status in ("NEW", "MODIFIED"):
                unpushed_paths.add(normalize_path(db_file.path))

        files_to_download: List[WorkspaceEntry] = []
        files_to_delete: List[str] = []
        files_to_snapshot: List[str] = []
        conflicting_files: List[str] = []

        # 1. Check which remote files must be downloaded locally
        for norm_path, remote_entry in remote_by_path.items():
            local_record = self.manager.db.get_file_by_path(norm_path)
            local_file = self.manager.root_path / norm_path

            is_remote_different = False
            if not local_file.is_file():
                is_remote_different = True
            elif local_record and local_record.sha256 != remote_entry.sha256:
                is_remote_different = True
            elif not local_record and local_file.is_file():
                try:
                    if compute_file_sha256(local_file) != remote_entry.sha256:
                        is_remote_different = True
                except Exception:
                    is_remote_different = True

            if is_remote_different:
                files_to_download.append(remote_entry)
                # If local file also has unpushed modifications, it is a conflict!
                if local_file.is_file() and norm_path in unpushed_paths:
                    conflicting_files.append(norm_path)
                    files_to_snapshot.append(norm_path)
                elif local_file.is_file():
                    files_to_snapshot.append(norm_path)

        # 2. Check which local files must be deleted because they are absent in remote
        # Git-like non-destructive rule: NEVER delete local files that are unpushed or newly created!
        for db_file in self.manager.db.list_files():
            norm_path = normalize_path(db_file.path)
            if norm_path in unpushed_paths or db_file.sync_status == "NEW":
                continue
            if db_file.sync_status == "SYNCED" and norm_path not in remote_by_path:
                files_to_delete.append(norm_path)
                local_file = self.manager.root_path / norm_path
                if local_file.is_file():
                    files_to_snapshot.append(norm_path)

        is_up_to_date = (
            len(files_to_download) == 0
            and len(files_to_delete) == 0
            and len(unpushed_paths) == 0
            and len(conflicting_files) == 0
        )

        return PullPreview(
            remote_head=remote_head,
            files_to_download=files_to_download,
            files_to_delete=files_to_delete,
            files_to_snapshot=sorted(list(set(files_to_snapshot))),
            conflicting_files=sorted(list(set(conflicting_files))),
            is_up_to_date=is_up_to_date,
        )

    def pull(self, confirm: bool = True, strategy: str = "merge") -> PullResult:
        """
        Executes Git-like non-destructive pull:
        1. Checks for conflicts if strategy is 'merge'.
        2. Creates safety snapshots of files to be overwritten or resolved.
        3. Downloads and decrypts remote objects.
        4. Handles conflicts per strategy ('merge', 'keep_both', 'keep_remote').
        5. Preserves unpushed local files and updates DB incrementally without wipe.
        """
        if not confirm:
            raise ValueError("Pull refused: explicit confirmation is required.")

        preview = self.pull_preview()
        if preview.remote_head == 0 or (
            preview.is_up_to_date and not preview.files_to_download and not preview.files_to_delete
        ):
            return PullResult(
                pulled_version=preview.remote_head,
                files_downloaded=0,
                files_deleted=0,
                snapshots_created=0,
                message="Workspace is already up to date.",
            )

        if preview.conflicting_files and strategy == "merge":
            conflict_names = ", ".join(preview.conflicting_files)
            raise DivergedWorkspaceError(
                f"Cannot merge pull: {len(preview.conflicting_files)} conflicting file(s) modified both locally and on Drive: "
                f"{conflict_names}. Please resolve conflicts by keeping remote, keeping both, or force pushing."
            )

        # 1. Create safety snapshots
        snapshots_created = 0
        for rel_path in preview.files_to_snapshot:
            local_file = self.manager.root_path / rel_path
            if local_file.is_file():
                self.manager.create_safety_snapshot(
                    rel_path, reason=f"pre-pull-v{preview.remote_head}"
                )
                snapshots_created += 1

        # 2. Download and decrypt objects
        files_downloaded = 0
        conflicts_set = set(preview.conflicting_files)

        for entry in preview.files_to_download:
            norm_path = normalize_path(entry.path)
            is_conflict = norm_path in conflicts_set

            if is_conflict and strategy == "keep_both":
                p = Path(norm_path)
                stem = p.stem
                suffix = p.suffix
                conflict_rel_path = f"{str(p.parent / stem)} (Drive conflict){suffix}" if str(p.parent) != "." else f"{stem} (Drive conflict){suffix}"
                target_path = self.manager.root_path / conflict_rel_path
            else:
                target_path = self.manager.root_path / entry.path

            target_path.parent.mkdir(parents=True, exist_ok=True)

            with self.manager.temp_manager.temp_file(suffix=".enc") as temp_enc:
                self.manifest_manager.download_object(
                    entry.file_id_hex, str(temp_enc)
                )
                file_id_bytes = bytes.fromhex(entry.file_id_hex)
                dec_sha256 = decrypt_file(
                    input_path=str(temp_enc),
                    output_path=str(target_path),
                    wmk=self.manifest_manager.wmk,
                    file_id=file_id_bytes,
                )
                if dec_sha256 != entry.sha256:
                    raise ValueError(
                        f"Integrity check failed for {entry.path}: "
                        f"expected {entry.sha256}, got {dec_sha256}"
                    )

            # Preserve modification timestamp
            if entry.mtime_ms > 0:
                mtime_sec = entry.mtime_ms / 1000.0
                try:
                    os.utime(target_path, (mtime_sec, mtime_sec))
                except OSError:
                    pass

            # Upsert into DB
            if is_conflict and strategy == "keep_both":
                conflict_record = FileRecord(
                    file_id=uuid.uuid4().hex,
                    path=conflict_rel_path,
                    size=entry.size,
                    mtime_ms=entry.mtime_ms,
                    sha256=entry.sha256,
                    sync_status="NEW",
                )
                self.manager.db.upsert_file(conflict_record)
            else:
                record = FileRecord(
                    file_id=entry.file_id_hex,
                    path=entry.path,
                    size=entry.size,
                    mtime_ms=entry.mtime_ms,
                    sha256=entry.sha256,
                    sync_status="SYNCED",
                )
                self.manager.db.upsert_file(record)

            files_downloaded += 1

        # 3. Delete files removed remotely
        files_deleted = 0
        for rel_path in preview.files_to_delete:
            target_path = self.manager.root_path / rel_path
            if target_path.is_file():
                try:
                    target_path.unlink(missing_ok=True)
                    files_deleted += 1
                except OSError:
                    pass
            rec = self.manager.db.get_file_by_path(rel_path)
            if rec:
                self.manager.db.delete_file(rec.file_id)

        # 4. Update base_version in DB without wiping existing unpushed records
        self.manager.db.set_state("base_version", str(preview.remote_head))

        return PullResult(
            pulled_version=preview.remote_head,
            files_downloaded=files_downloaded,
            files_deleted=files_deleted,
            snapshots_created=snapshots_created,
            message=f"Successfully pulled version {preview.remote_head}.",
        )

    def hard_reset(self) -> PullResult:
        """
        Hard resets the workspace to match remote HEAD:
        1. Takes safety snapshots of any local unpushed or modified files.
        2. Deletes local files that do not exist in remote manifest.
        3. Downloads all remote objects.
        4. Cleanly rebuilds local SQLite database from remote catalog.
        """
        remote_head = self.manifest_manager.get_remote_head()
        if remote_head == 0:
            return PullResult(
                pulled_version=0,
                files_downloaded=0,
                files_deleted=0,
                snapshots_created=0,
                message="Remote repository is empty; nothing to reset to.",
            )

        remote_manifest = self.manifest_manager.get_manifest(remote_head)
        remote_by_path = {normalize_path(e.path): e for e in remote_manifest.entries}

        detector = ChangeDetector(self.manager.root_path, self.manager.db, self.ignore_patterns)
        scan = detector.scan()

        snapshots_created = 0
        for f in scan.new_files + scan.modified_files:
            p = normalize_path(f.path)
            local_f = self.manager.root_path / p
            if local_f.is_file():
                self.manager.create_safety_snapshot(p, reason=f"pre-hard-reset-v{remote_head}")
                snapshots_created += 1

        files_deleted = 0
        for root, _dirs, files in os.walk(self.manager.root_path):
            for filename in files:
                full_path = Path(root) / filename
                rel = full_path.relative_to(self.manager.root_path).as_posix()
                if detector.is_ignored(rel):
                    continue
                norm_rel = normalize_path(rel)
                if norm_rel not in remote_by_path:
                    try:
                        full_path.unlink(missing_ok=True)
                        files_deleted += 1
                    except OSError:
                        pass

        files_downloaded = 0
        for entry in remote_manifest.entries:
            target_path = self.manager.root_path / entry.path
            target_path.parent.mkdir(parents=True, exist_ok=True)

            with self.manager.temp_manager.temp_file(suffix=".enc") as temp_enc:
                self.manifest_manager.download_object(entry.file_id_hex, str(temp_enc))
                file_id_bytes = bytes.fromhex(entry.file_id_hex)
                dec_sha256 = decrypt_file(
                    input_path=str(temp_enc),
                    output_path=str(target_path),
                    wmk=self.manifest_manager.wmk,
                    file_id=file_id_bytes,
                )
                if dec_sha256 != entry.sha256:
                    raise ValueError(f"Integrity check failed for {entry.path}")

            if entry.mtime_ms > 0:
                mtime_sec = entry.mtime_ms / 1000.0
                try:
                    os.utime(target_path, (mtime_sec, mtime_sec))
                except OSError:
                    pass

            files_downloaded += 1

        catalog = remote_manifest.to_catalog()
        rebuild_db_from_catalog(
            catalog=catalog,
            db=self.manager.db,
            base_version=remote_head,
            clear_existing=True,
        )

        return PullResult(
            pulled_version=remote_head,
            files_downloaded=files_downloaded,
            files_deleted=files_deleted,
            snapshots_created=snapshots_created,
            message=f"Workspace hard reset to remote version {remote_head}.",
        )

