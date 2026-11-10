"""
Storage subsystem exports for SecureWorkspace.
"""

from secureworkspace_core.storage.adapter import (
    AuthenticationError,
    FileNotFoundOnStorageError,
    FolderBoundaryViolationError,
    RateLimitError,
    RemoteFile,
    StorageAdapter,
    StorageError,
)
from secureworkspace_core.storage.drive import GoogleDriveStorageAdapter
from secureworkspace_core.storage.mock import MockStorageAdapter

__all__ = [
    "StorageAdapter",
    "RemoteFile",
    "StorageError",
    "AuthenticationError",
    "RateLimitError",
    "FolderBoundaryViolationError",
    "FileNotFoundOnStorageError",
    "GoogleDriveStorageAdapter",
    "MockStorageAdapter",
]
