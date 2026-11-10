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

from secureworkspace_core.sync.manifest import RemoteManifestManager, VersionManifest
from secureworkspace_core.workspace.catalog import WorkspaceEntry
from secureworkspace_core.workspace.change_detector import ChangeDetector
from secureworkspace_core.workspace.db import normalize_path
from secureworkspace_core.workspace.file_ops import decrypt_file
from secureworkspace_core.workspace.manager import WorkspaceManager
from secureworkspace_core.workspace.rebuild import rebuild_db_from_catalog


@dataclass
class PullPreview:
    remote_head: int
    files_to_download: List[WorkspaceEntry] = field(default_factory=list)
    files_to_delete: List[str] = field(default_factory=list)
    files_to_snapshot: List[str] = field(default_factory=list)
    is_up_to_date: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "remote_head": self.remote_head,
            "is_up_to_date": self.is_up_to_date,
            "download_count": len(self.files_to_download),
            "delete_count": len(self.files_to_delete),
            "snapshot_count": len(self.files_to_snapshot),
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
        Does not modify files.
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

        files_to_download: List[WorkspaceEntry] = []
        files_to_delete: List[str] = []
        files_to_snapshot: List[str] = []

        # 1. Check which remote files must be downloaded locally
        for norm_path, remote_entry in remote_by_path.items():
            local_record = self.manager.db.get_file_by_path(norm_path)
            local_file = self.manager.root_path / norm_path

            if not local_file.is_file() or (
                local_record and local_record.sha256 != remote_entry.sha256
            ):
                files_to_download.append(remote_entry)
                # If there are local unpushed edits or local file exists, safety snapshot it
                if local_file.is_file() and (norm_path in unpushed_paths or (local_record and local_record.sha256 != remote_entry.sha256)):
                    files_to_snapshot.append(norm_path)

        # 2. Check which local files must be deleted because they are absent in remote
        for db_file in self.manager.db.list_files():
            norm_path = normalize_path(db_file.path)
            if db_file.sync_status != "DELETED" and norm_path not in remote_by_path:
                files_to_delete.append(norm_path)
                local_file = self.manager.root_path / norm_path
                if local_file.is_file():
                    files_to_snapshot.append(norm_path)

        is_up_to_date = (
            len(files_to_download) == 0
            and len(files_to_delete) == 0
            and len(unpushed_paths) == 0
        )

        return PullPreview(
            remote_head=remote_head,
            files_to_download=files_to_download,
            files_to_delete=files_to_delete,
            files_to_snapshot=sorted(list(set(files_to_snapshot))),
            is_up_to_date=is_up_to_date,
        )

    def pull(self, confirm: bool = True) -> PullResult:
        """
        Executes pull:
        1. Creates local safety snapshots of files to be overwritten/deleted.
        2. Downloads and decrypts remote objects.
        3. Deletes removed files.
        4. Rebuilds local SQLite metadata from remote manifest.
        """
        if not confirm:
            raise ValueError("Pull refused: explicit confirmation is required.")

        preview = self.pull_preview()
        if preview.remote_head == 0 or preview.is_up_to_date:
            return PullResult(
                pulled_version=preview.remote_head,
                files_downloaded=0,
                files_deleted=0,
                snapshots_created=0,
                message="Workspace is already up to date.",
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
        for entry in preview.files_to_download:
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

        # 4. Rebuild SQLite database from remote manifest catalog
        remote_manifest = self.manifest_manager.get_manifest(preview.remote_head)
        catalog = remote_manifest.to_catalog()
        rebuild_db_from_catalog(
            catalog=catalog,
            db=self.manager.db,
            base_version=preview.remote_head,
            clear_existing=True,
        )

        return PullResult(
            pulled_version=preview.remote_head,
            files_downloaded=files_downloaded,
            files_deleted=files_deleted,
            snapshots_created=snapshots_created,
            message=f"Successfully pulled version {preview.remote_head}.",
        )
