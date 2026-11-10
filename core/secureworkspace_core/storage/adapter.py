"""
Abstract Storage Adapter interface and data models for SecureWorkspace.
All cloud and local storage backends must implement this contract.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Callable, Dict, List, Optional


class StorageError(Exception):
    """Base exception for all storage-related errors."""
    pass


class AuthenticationError(StorageError):
    """Raised when authentication credentials or tokens are invalid/expired."""
    pass


class RateLimitError(StorageError):
    """Raised when storage API rate limits (HTTP 429) are exhausted."""
    pass


class FolderBoundaryViolationError(StorageError):
    """Raised when an operation attempts to access or modify data outside the SecureWorkspace folder."""
    pass


class FileNotFoundOnStorageError(StorageError):
    """Raised when a requested remote file or folder does not exist."""
    pass


@dataclass
class RemoteFile:
    """Represents a remote file or folder on the storage provider."""
    id: str
    name: str
    size: int
    modified_time: str
    parent_id: Optional[str] = None
    is_folder: bool = False
    md5_checksum: Optional[str] = None
    app_properties: Dict[str, str] = field(default_factory=dict)


class StorageAdapter(ABC):
    """Abstract interface defining required storage operations."""

    @abstractmethod
    def ensure_app_folder(self) -> str:
        """
        Finds or creates the isolated SecureWorkspace app folder.
        Returns the unique folder ID.
        """
        pass

    @abstractmethod
    def list_files(self, folder_id: Optional[str] = None) -> List[RemoteFile]:
        """
        Lists all files strictly within the specified folder.
        Defaults to the root app folder if folder_id is None.
        """
        pass

    @abstractmethod
    def upload_file(
        self,
        local_path: str,
        remote_name: str,
        folder_id: Optional[str] = None,
        progress_callback: Optional[Callable[[int, int], None]] = None,
    ) -> RemoteFile:
        """
        Uploads a local file to the storage provider.
        Supports progress reporting (bytes_uploaded, total_bytes).
        """
        pass

    @abstractmethod
    def upload_bytes(
        self,
        data: bytes,
        remote_name: str,
        folder_id: Optional[str] = None,
    ) -> RemoteFile:
        """
        Uploads an in-memory byte buffer to the storage provider.
        """
        pass

    @abstractmethod
    def download_file(
        self,
        remote_id: str,
        local_path: str,
        progress_callback: Optional[Callable[[int, int], None]] = None,
    ) -> None:
        """
        Downloads a remote file directly to a local file path.
        """
        pass

    @abstractmethod
    def download_bytes(self, remote_id: str) -> bytes:
        """
        Downloads and returns a remote file's contents as bytes.
        """
        pass

    @abstractmethod
    def delete_file(self, remote_id: str) -> None:
        """
        Permanently deletes a file by its remote ID.
        Must enforce folder boundary checks before deletion.
        """
        pass

    @abstractmethod
    def get_metadata(self, remote_id: str) -> RemoteFile:
        """
        Retrieves remote file metadata.
        """
        pass
