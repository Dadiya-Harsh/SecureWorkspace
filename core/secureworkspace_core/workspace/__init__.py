"""
SecureWorkspace workspace package.
Handles database metadata, file operations, headers, catalogs, change detection,
and directory management.
"""

from secureworkspace_core.workspace.catalog import WorkspaceCatalog, WorkspaceEntry
from secureworkspace_core.workspace.change_detector import (
    ChangeDetectionResult,
    ChangeDetector,
    FileChange,
)
from secureworkspace_core.workspace.db import (
    FileRecord,
    SafetySnapshotRecord,
    VersionRecord,
    WorkspaceDB,
    compute_path_hash,
    decrypt_path,
    encrypt_path,
    normalize_path,
)
from secureworkspace_core.workspace.file_ops import (
    EncryptedFileMetadata,
    decrypt_file,
    encrypt_file,
)
from secureworkspace_core.workspace.header import WorkspaceHeader
from secureworkspace_core.workspace.manager import (
    WorkspaceLock,
    WorkspaceLockedError,
    WorkspaceManager,
)
from secureworkspace_core.workspace.rebuild import (
    rebuild_db_from_catalog,
    rebuild_db_from_encrypted_catalog,
    rebuild_workspace_db,
)
from secureworkspace_core.workspace.temp_manager import TempFileManager

__all__ = [
    "ChangeDetectionResult",
    "ChangeDetector",
    "EncryptedFileMetadata",
    "FileChange",
    "FileRecord",
    "SafetySnapshotRecord",
    "TempFileManager",
    "VersionRecord",
    "WorkspaceCatalog",
    "WorkspaceDB",
    "WorkspaceEntry",
    "WorkspaceHeader",
    "WorkspaceLock",
    "WorkspaceLockedError",
    "WorkspaceManager",
    "compute_path_hash",
    "decrypt_file",
    "decrypt_path",
    "encrypt_file",
    "encrypt_path",
    "normalize_path",
    "rebuild_db_from_catalog",
    "rebuild_db_from_encrypted_catalog",
    "rebuild_workspace_db",
]
