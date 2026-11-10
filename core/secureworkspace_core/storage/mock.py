"""
Mock in-memory storage adapter for deterministic, lightning-fast unit tests.
Validates folder boundaries, uploads, downloads, listings, and progress reporting without network.
"""

from datetime import datetime, timezone
import hashlib
import os
from typing import Callable, Dict, List, Optional, Tuple
import uuid

from secureworkspace_core.storage.adapter import (
    FileNotFoundOnStorageError,
    FolderBoundaryViolationError,
    RemoteFile,
    StorageAdapter,
)


class MockStorageAdapter(StorageAdapter):
    """Simulated in-memory storage backend."""

    def __init__(self, root_folder_id: str = "mock_secureworkspace_folder_root"):
        self.root_folder_id = root_folder_id
        # remote_id -> (RemoteFile, bytes)
        self._storage: Dict[str, Tuple[RemoteFile, bytes]] = {}

    def ensure_app_folder(self) -> str:
        return self.root_folder_id

    def _verify_boundary(self, remote_file: RemoteFile) -> None:
        if remote_file.parent_id != self.root_folder_id:
            raise FolderBoundaryViolationError(
                f"Access denied: file '{remote_file.name}' (ID: {remote_file.id}) "
                f"is in parent '{remote_file.parent_id}', not inside the app folder '{self.root_folder_id}'."
            )

    def list_files(self, folder_id: Optional[str] = None) -> List[RemoteFile]:
        target_folder = folder_id or self.root_folder_id
        results = []
        for meta, _ in self._storage.values():
            if meta.parent_id == target_folder:
                results.append(meta)
        return sorted(results, key=lambda f: f.name)

    def upload_file(
        self,
        local_path: str,
        remote_name: str,
        folder_id: Optional[str] = None,
        progress_callback: Optional[Callable[[int, int], None]] = None,
    ) -> RemoteFile:
        target_folder = folder_id or self.root_folder_id
        if target_folder != self.root_folder_id:
            raise FolderBoundaryViolationError(f"Cannot upload outside the app folder: {target_folder}")

        with open(local_path, "rb") as f:
            data = f.read()

        if progress_callback:
            progress_callback(len(data), len(data))

        return self.upload_bytes(data, remote_name, folder_id=target_folder)

    def upload_bytes(
        self,
        data: bytes,
        remote_name: str,
        folder_id: Optional[str] = None,
    ) -> RemoteFile:
        target_folder = folder_id or self.root_folder_id
        if target_folder != self.root_folder_id:
            raise FolderBoundaryViolationError(f"Cannot upload outside the app folder: {target_folder}")

        file_id = f"mock_file_{uuid.uuid4().hex[:12]}"
        now_iso = datetime.now(timezone.utc).isoformat()
        md5_hash = hashlib.md5(data).hexdigest()

        meta = RemoteFile(
            id=file_id,
            name=remote_name,
            size=len(data),
            modified_time=now_iso,
            parent_id=target_folder,
            md5_checksum=md5_hash,
            app_properties={"app": "SecureWorkspace"},
        )
        self._storage[file_id] = (meta, data)
        return meta

    def download_file(
        self,
        remote_id: str,
        local_path: str,
        progress_callback: Optional[Callable[[int, int], None]] = None,
    ) -> None:
        data = self.download_bytes(remote_id)
        os.makedirs(os.path.dirname(os.path.abspath(local_path)), exist_ok=True)
        with open(local_path, "wb") as f:
            f.write(data)

        if progress_callback:
            progress_callback(len(data), len(data))

    def download_bytes(self, remote_id: str) -> bytes:
        if remote_id not in self._storage:
            raise FileNotFoundOnStorageError(f"File not found on storage: {remote_id}")
        meta, data = self._storage[remote_id]
        self._verify_boundary(meta)
        return data

    def delete_file(self, remote_id: str) -> None:
        if remote_id not in self._storage:
            raise FileNotFoundOnStorageError(f"File not found for deletion: {remote_id}")
        meta, _ = self._storage[remote_id]
        self._verify_boundary(meta)
        del self._storage[remote_id]

    def get_metadata(self, remote_id: str) -> RemoteFile:
        if remote_id not in self._storage:
            raise FileNotFoundOnStorageError(f"File not found: {remote_id}")
        meta, _ = self._storage[remote_id]
        self._verify_boundary(meta)
        return meta
