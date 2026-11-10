"""
Version manifest serialization, encryption, and remote manifest manager.
Manages HEAD, version manifests in versions/, and objects/ on the StorageAdapter.
"""

from dataclasses import asdict, dataclass, field
import io
import json
from typing import Any, Dict, List, Optional
import uuid

from secureworkspace_core.crypto.keys import derive_index_key
from secureworkspace_core.crypto.secretstream import (
    SecretStreamDecryptor,
    SecretStreamEncryptor,
)
from secureworkspace_core.storage.adapter import (
    FileNotFoundOnStorageError,
    RemoteFile,
    StorageAdapter,
    StorageError,
)
from secureworkspace_core.sync.errors import (
    ConcurrentPushError,
    ManifestNotFoundError,
)
from secureworkspace_core.workspace.catalog import WorkspaceCatalog, WorkspaceEntry
from secureworkspace_core.workspace.db import normalize_path


@dataclass
class VersionManifest:
    version_number: int
    manifest_id: str
    timestamp_ms: int
    device_id: str
    message: str = ""
    entries: List[WorkspaceEntry] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "format": "SecureWorkspaceManifest_v1",
            "version_number": self.version_number,
            "manifest_id": self.manifest_id,
            "timestamp_ms": self.timestamp_ms,
            "device_id": self.device_id,
            "message": self.message,
            "entries": [asdict(e) for e in self.entries],
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "VersionManifest":
        entries = [WorkspaceEntry(**item) for item in data.get("entries", [])]
        return cls(
            version_number=data["version_number"],
            manifest_id=data["manifest_id"],
            timestamp_ms=data["timestamp_ms"],
            device_id=data.get("device_id", "unknown"),
            message=data.get("message", ""),
            entries=entries,
        )

    def serialize_encrypted(self, wmk: bytes) -> bytes:
        """Encrypts manifest JSON using index key derived from WMK."""
        index_key = derive_index_key(wmk)
        raw_json = json.dumps(self.to_dict(), indent=2, sort_keys=True).encode("utf-8")
        encryptor = SecretStreamEncryptor(index_key)

        source = io.BytesIO(raw_json)
        dest = io.BytesIO()
        encryptor.encrypt(source, dest)
        return dest.getvalue()

    @classmethod
    def deserialize_encrypted(cls, ciphertext: bytes, wmk: bytes) -> "VersionManifest":
        """Decrypts manifest from SecretStream ciphertext."""
        index_key = derive_index_key(wmk)
        decryptor = SecretStreamDecryptor(index_key)

        source = io.BytesIO(ciphertext)
        dest = io.BytesIO()
        decryptor.decrypt(source, dest)
        data = json.loads(dest.getvalue().decode("utf-8"))
        return cls.from_dict(data)

    def to_catalog(self) -> WorkspaceCatalog:
        """Converts manifest into a WorkspaceCatalog."""
        catalog = WorkspaceCatalog()
        for e in self.entries:
            catalog.add_entry(e)
        return catalog

    def get_entry_by_path(self, path: str) -> Optional[WorkspaceEntry]:
        norm = normalize_path(path)
        for e in self.entries:
            if normalize_path(e.path) == norm:
                return e
        return None


class RemoteManifestManager:
    """
    Manages remote HEAD pointer, version manifests in versions/,
    and encrypted file objects in objects/ via the StorageAdapter.
    """

    HEAD_FILENAME = "HEAD"
    VERSIONS_PREFIX = "versions/"
    OBJECTS_PREFIX = "objects/"

    def __init__(self, storage: StorageAdapter, wmk: bytes):
        self.storage = storage
        self.wmk = wmk

    def get_remote_head(self) -> int:
        """
        Reads the current remote HEAD version number.
        Returns 0 if no HEAD file exists on remote storage.
        """
        files = self.storage.list_files()
        head_file = None
        for f in files:
            if f.name == self.HEAD_FILENAME:
                head_file = f
                break

        if not head_file:
            return 0

        try:
            head_bytes = self.storage.download_bytes(head_file.id)
            head_str = head_bytes.decode("utf-8").strip()
            return int(head_str)
        except (ValueError, UnicodeDecodeError, StorageError):
            return 0

    def update_remote_head(
        self, new_version: int, expected_head: Optional[int] = None
    ) -> None:
        """
        Updates remote HEAD file to new_version.
        If expected_head is given, verifies remote HEAD matches expected_head before writing.
        """
        files = self.storage.list_files()
        existing_heads = [f for f in files if f.name == self.HEAD_FILENAME]

        if expected_head is not None:
            current_head = 0
            if existing_heads:
                try:
                    head_bytes = self.storage.download_bytes(existing_heads[0].id)
                    current_head = int(head_bytes.decode("utf-8").strip())
                except (ValueError, StorageError):
                    current_head = 0

            if current_head != expected_head:
                raise ConcurrentPushError(
                    f"Remote HEAD changed concurrently from {expected_head} to {current_head}."
                )

        payload = f"{new_version}\n".encode("utf-8")
        self.storage.upload_bytes(payload, self.HEAD_FILENAME)

        # Clean up older HEAD objects if multiple exist
        for old_head in existing_heads:
            try:
                self.storage.delete_file(old_head.id)
            except StorageError:
                pass

    def upload_manifest(self, manifest: VersionManifest) -> RemoteFile:
        """Encrypts and uploads a VersionManifest."""
        cipher_bytes = manifest.serialize_encrypted(self.wmk)
        remote_name = f"{self.VERSIONS_PREFIX}{manifest.version_number}.manifest"
        return self.storage.upload_bytes(cipher_bytes, remote_name)

    def get_manifest(self, version_number: int) -> VersionManifest:
        """
        Downloads and decrypts manifest for version_number.
        Raises ManifestNotFoundError if not found.
        """
        remote_name = f"{self.VERSIONS_PREFIX}{version_number}.manifest"
        files = self.storage.list_files()
        manifest_file = None
        for f in files:
            if f.name == remote_name:
                manifest_file = f
                break

        if not manifest_file:
            raise ManifestNotFoundError(f"Remote manifest not found: {remote_name}")

        cipher_bytes = self.storage.download_bytes(manifest_file.id)
        return VersionManifest.deserialize_encrypted(cipher_bytes, self.wmk)

    def list_remote_versions(self) -> List[VersionManifest]:
        """
        Lists all remote version manifests ordered by version_number descending.
        """
        files = self.storage.list_files()
        version_files = []
        for f in files:
            if f.name.startswith(self.VERSIONS_PREFIX) and f.name.endswith(".manifest"):
                # Extract version number
                version_part = f.name[len(self.VERSIONS_PREFIX) : -len(".manifest")]
                try:
                    v_num = int(version_part)
                    version_files.append((v_num, f))
                except ValueError:
                    continue

        version_files.sort(key=lambda item: item[0], reverse=True)
        manifests = []
        for _, remote_file in version_files:
            try:
                cipher_bytes = self.storage.download_bytes(remote_file.id)
                manifests.append(
                    VersionManifest.deserialize_encrypted(cipher_bytes, self.wmk)
                )
            except Exception:
                continue

        return manifests

    def find_remote_object(self, file_id_hex: str) -> Optional[RemoteFile]:
        """Looks for an existing object in remote storage."""
        remote_name = f"{self.OBJECTS_PREFIX}{file_id_hex}"
        for f in self.storage.list_files():
            if f.name == remote_name:
                return f
        return None

    def upload_object(self, local_ciphertext_path: str, file_id_hex: str) -> RemoteFile:
        """Uploads an encrypted file ciphertext to objects/{file_id_hex}."""
        remote_name = f"{self.OBJECTS_PREFIX}{file_id_hex}"
        return self.storage.upload_file(local_ciphertext_path, remote_name)

    def download_object(self, file_id_hex: str, dest_local_path: str) -> None:
        """Downloads objects/{file_id_hex} to dest_local_path."""
        obj = self.find_remote_object(file_id_hex)
        if not obj:
            raise FileNotFoundOnStorageError(f"Remote object missing: {file_id_hex}")
        self.storage.download_file(obj.id, dest_local_path)
