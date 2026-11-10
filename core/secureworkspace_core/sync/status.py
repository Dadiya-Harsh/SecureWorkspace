"""
Workspace status engine for SecureWorkspace.
Calculates local unpushed changes, remote Drive versions ahead, and diverged state.
Strictly read-only; alters neither local files nor remote storage.
"""

from dataclasses import asdict, dataclass
from typing import Any, Dict, List, Optional

from secureworkspace_core.sync.manifest import RemoteManifestManager
from secureworkspace_core.workspace.change_detector import (
    ChangeDetectionResult,
    ChangeDetector,
    FileChange,
)
from secureworkspace_core.workspace.manager import WorkspaceManager


@dataclass
class SyncStatus:
    base_version: int
    remote_head: int
    versions_ahead: int
    local_changes: ChangeDetectionResult
    is_diverged: bool
    is_up_to_date: bool

    @property
    def has_local_changes(self) -> bool:
        return self.local_changes.has_changes

    @property
    def total_local_changes(self) -> int:
        return self.local_changes.total_changes

    def to_dict(self) -> Dict[str, Any]:
        """Returns structured JSON-serializable dictionary for UI/API contract."""
        return {
            "base_version": self.base_version,
            "remote_head": self.remote_head,
            "versions_ahead": self.versions_ahead,
            "has_local_changes": self.has_local_changes,
            "is_diverged": self.is_diverged,
            "is_up_to_date": self.is_up_to_date,
            "changes": {
                "new": [asdict(f) for f in self.local_changes.new_files],
                "modified": [asdict(f) for f in self.local_changes.modified_files],
                "deleted": [asdict(f) for f in self.local_changes.deleted_files],
                "synced_count": len(self.local_changes.synced_files),
            },
        }


class StatusEngine:
    """Computes sync status between local workspace and remote StorageAdapter."""

    def __init__(
        self,
        manager: WorkspaceManager,
        manifest_manager: RemoteManifestManager,
        ignore_patterns: Optional[List[str]] = None,
    ):
        self.manager = manager
        self.manifest_manager = manifest_manager
        self.ignore_patterns = ignore_patterns

    def status(self, quick: bool = False) -> SyncStatus:
        """
        Calculates full sync status.
        Reads remote HEAD and local disk/DB; does NOT modify local or remote data.
        """
        # 1. Base version on this device
        base_version_str = self.manager.db.get_state("base_version", default="0")
        try:
            base_version = int(base_version_str)
        except (ValueError, TypeError):
            base_version = 0

        # 2. Local unpushed changes
        detector = ChangeDetector(
            workspace_root=self.manager.root_path,
            db=self.manager.db,
            ignore_patterns=self.ignore_patterns,
        )
        local_changes = detector.scan(quick=quick)

        # 3. Remote latest version (HEAD)
        remote_head = self.manifest_manager.get_remote_head()

        # 4. Versions ahead & divergence
        versions_ahead = max(0, remote_head - base_version)
        is_diverged = local_changes.has_changes and (versions_ahead > 0)
        is_up_to_date = (not local_changes.has_changes) and (versions_ahead == 0)

        return SyncStatus(
            base_version=base_version,
            remote_head=remote_head,
            versions_ahead=versions_ahead,
            local_changes=local_changes,
            is_diverged=is_diverged,
            is_up_to_date=is_up_to_date,
        )
