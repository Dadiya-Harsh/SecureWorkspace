"""
Push engine for SecureWorkspace.
Implements push_preview and push(message, confirm_mass_deletion):
Uploads new and modified objects in chunks, uploads encrypted manifest,
verifies remote HEAD against race conditions, and updates HEAD.
"""

from dataclasses import asdict, dataclass, field
import time
from typing import Any, Dict, List, Optional
import uuid

from secureworkspace_core.sync.errors import (
    DriveAheadError,
    MassDeletionGuardError,
)
from secureworkspace_core.sync.manifest import RemoteManifestManager, VersionManifest
from secureworkspace_core.workspace.catalog import WorkspaceEntry
from secureworkspace_core.workspace.change_detector import (
    ChangeDetector,
    FileChange,
)
from secureworkspace_core.workspace.db import (
    FileRecord,
    VersionRecord,
    normalize_path,
)
from secureworkspace_core.workspace.file_ops import encrypt_file
from secureworkspace_core.workspace.manager import WorkspaceManager


@dataclass
class PushPreview:
    base_version: int
    remote_head: int
    is_refused: bool
    refusal_reason: Optional[str] = None
    files_to_upload: List[FileChange] = field(default_factory=list)
    files_to_delete: List[FileChange] = field(default_factory=list)
    is_mass_deletion: bool = False

    @property
    def has_changes(self) -> bool:
        return bool(self.files_to_upload or self.files_to_delete)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "base_version": self.base_version,
            "remote_head": self.remote_head,
            "is_refused": self.is_refused,
            "refusal_reason": self.refusal_reason,
            "has_changes": self.has_changes,
            "is_mass_deletion": self.is_mass_deletion,
            "upload_count": len(self.files_to_upload),
            "delete_count": len(self.files_to_delete),
            "files_to_upload": [asdict(f) for f in self.files_to_upload],
            "files_to_delete": [asdict(f) for f in self.files_to_delete],
        }


@dataclass
class PushResult:
    success: bool
    new_version: int
    files_uploaded: int
    files_deleted: int
    manifest_id: str
    message: str


class PushEngine:
    """Coordinates local change scanning, object uploads, manifest creation, and HEAD updates."""

    MASS_DELETION_THRESHOLD_COUNT = 5
    MASS_DELETION_THRESHOLD_RATIO = 0.5

    def __init__(
        self,
        manager: WorkspaceManager,
        manifest_manager: RemoteManifestManager,
        ignore_patterns: Optional[List[str]] = None,
    ):
        self.manager = manager
        self.manifest_manager = manifest_manager
        self.ignore_patterns = ignore_patterns

    def push_preview(self) -> PushPreview:
        """
        Analyzes workspace state to preview push:
        Detects if remote Drive is ahead, categorizes changes, and checks mass deletion.
        """
        base_version_str = self.manager.db.get_state("base_version", default="0")
        try:
            base_version = int(base_version_str)
        except (ValueError, TypeError):
            base_version = 0

        remote_head = self.manifest_manager.get_remote_head()

        # Check if remote is ahead
        if remote_head > base_version:
            return PushPreview(
                base_version=base_version,
                remote_head=remote_head,
                is_refused=True,
                refusal_reason=(
                    f"Drive has newer versions ({remote_head} > {base_version}). "
                    "Pull changes first or use force_push."
                ),
            )

        # Scan for changes
        detector = ChangeDetector(
            self.manager.root_path, self.manager.db, self.ignore_patterns
        )
        scan_res = detector.scan()

        files_to_upload = scan_res.new_files + scan_res.modified_files
        files_to_delete = scan_res.deleted_files

        # Mass deletion guard
        active_files = [f for f in self.manager.db.list_files() if f.sync_status != "DELETED"]
        is_mass_deletion = False
        if len(files_to_delete) >= self.MASS_DELETION_THRESHOLD_COUNT:
            if active_files and (len(files_to_delete) / len(active_files)) >= self.MASS_DELETION_THRESHOLD_RATIO:
                is_mass_deletion = True

        return PushPreview(
            base_version=base_version,
            remote_head=remote_head,
            is_refused=False,
            files_to_upload=files_to_upload,
            files_to_delete=files_to_delete,
            is_mass_deletion=is_mass_deletion,
        )

    def push(
        self,
        message: str = "",
        confirm_mass_deletion: bool = False,
        device_id: str = "desktop",
    ) -> PushResult:
        """
        Executes push:
        1. Checks preview (refusal & mass deletion guard).
        2. Encrypts and uploads modified/new objects.
        3. Constructs and uploads encrypted VersionManifest.
        4. Atomically updates remote HEAD with pre-check.
        5. Updates local SQLite database.
        """
        preview = self.push_preview()
        if preview.is_refused:
            raise DriveAheadError(preview.refusal_reason)

        if not preview.has_changes:
            return PushResult(
                success=True,
                new_version=preview.base_version,
                files_uploaded=0,
                files_deleted=0,
                manifest_id="",
                message="No changes to push; workspace is up to date.",
            )

        if preview.is_mass_deletion and not confirm_mass_deletion:
            raise MassDeletionGuardError(
                f"Mass deletion detected: push would delete {len(preview.files_to_delete)} files. "
                "Explicit confirm_mass_deletion=True is required."
            )

        # 1. Upload new / modified objects
        uploaded_entries: Dict[str, WorkspaceEntry] = {}
        for change in preview.files_to_upload:
            # Each distinct file version content gets a unique object ID (immutable object store)
            file_id_bytes = uuid.uuid4().bytes
            file_id_hex = file_id_bytes.hex()
            local_input_path = self.manager.root_path / change.path

            with self.manager.temp_manager.temp_file(suffix=".enc") as temp_enc:
                meta = encrypt_file(
                    input_path=str(local_input_path),
                    output_path=str(temp_enc),
                    wmk=self.manifest_manager.wmk,
                    file_id=file_id_bytes,
                )
                self.manifest_manager.upload_object(str(temp_enc), file_id_hex)

            uploaded_entries[change.path] = WorkspaceEntry(
                path=change.path,
                file_id_hex=file_id_hex,
                size=meta.plaintext_size,
                sha256=meta.plaintext_sha256,
                mtime_ms=change.mtime_ms,
            )

        # 2. Build complete entry list for the new version manifest
        deleted_paths = {normalize_path(f.path) for f in preview.files_to_delete}
        final_entries_by_path: Dict[str, WorkspaceEntry] = {}

        # Retain previous active files not deleted and not overwritten
        for db_file in self.manager.db.list_files():
            norm = normalize_path(db_file.path)
            if db_file.sync_status != "DELETED" and norm not in deleted_paths and norm not in uploaded_entries:
                final_entries_by_path[norm] = WorkspaceEntry(
                    path=norm,
                    file_id_hex=db_file.file_id,
                    size=db_file.size,
                    sha256=db_file.sha256,
                    mtime_ms=db_file.mtime_ms,
                )

        # Add newly uploaded entries
        for path, entry in uploaded_entries.items():
            final_entries_by_path[normalize_path(path)] = entry

        next_version = preview.remote_head + 1
        now_ms = int(time.time() * 1000)
        manifest_id = uuid.uuid4().hex

        manifest = VersionManifest(
            version_number=next_version,
            manifest_id=manifest_id,
            timestamp_ms=now_ms,
            device_id=device_id,
            message=message,
            entries=sorted(final_entries_by_path.values(), key=lambda e: e.path),
        )

        # 3. Upload encrypted manifest
        self.manifest_manager.upload_manifest(manifest)

        # 4. Atomic update of remote HEAD with concurrent-push pre-check
        self.manifest_manager.update_remote_head(
            new_version=next_version, expected_head=preview.remote_head
        )

        # 5. Update local SQLite metadata
        for norm_path, entry in final_entries_by_path.items():
            self.manager.db.upsert_file(
                FileRecord(
                    file_id=entry.file_id_hex,
                    path=entry.path,
                    size=entry.size,
                    mtime_ms=entry.mtime_ms,
                    sha256=entry.sha256,
                    sync_status="SYNCED",
                )
            )

        for del_path in deleted_paths:
            db_rec = self.manager.db.get_file_by_path(del_path)
            if db_rec:
                self.manager.db.mark_file_deleted(db_rec.file_id)

        # Record version in local DB versions table
        self.manager.db.record_version(
            VersionRecord(
                version_number=next_version,
                manifest_id=manifest_id,
                timestamp_ms=now_ms,
                device_id=device_id,
                message=message,
                file_count=len(final_entries_by_path),
            )
        )
        self.manager.db.set_state("base_version", str(next_version))

        return PushResult(
            success=True,
            new_version=next_version,
            files_uploaded=len(uploaded_entries),
            files_deleted=len(preview.files_to_delete),
            manifest_id=manifest_id,
            message=f"Successfully pushed version {next_version}.",
        )
