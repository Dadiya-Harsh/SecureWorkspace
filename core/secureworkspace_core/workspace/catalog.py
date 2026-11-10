"""
Workspace catalog (encrypted index).
Maintains the mapping of user file paths to encrypted object IDs and hashes.
"""

from dataclasses import asdict, dataclass
import io
import json
from typing import Dict, List
from secureworkspace_core.crypto.keys import derive_index_key
from secureworkspace_core.crypto.secretstream import (
    SecretStreamDecryptor,
    SecretStreamEncryptor,
)


@dataclass
class WorkspaceEntry:
    path: str          # Normalized relative path (e.g. "notes/todo.txt")
    file_id_hex: str   # 32-char hex representation of file UUID
    size: int          # Plaintext size in bytes
    sha256: str        # Plaintext SHA-256 hash
    mtime_ms: int      # Modification timestamp in ms


class WorkspaceCatalog:
    """In-memory catalog of all files tracked inside a workspace."""

    def __init__(self, entries: Dict[str, WorkspaceEntry] | None = None):
        self._entries: Dict[str, WorkspaceEntry] = entries or {}

    def add_entry(self, entry: WorkspaceEntry):
        normalized_path = entry.path.replace("\\", "/").strip("/")
        self._entries[normalized_path] = entry

    def remove_entry(self, path: str) -> bool:
        normalized_path = path.replace("\\", "/").strip("/")
        return self._entries.pop(normalized_path, None) is not None

    def get_entry(self, path: str) -> WorkspaceEntry | None:
        normalized_path = path.replace("\\", "/").strip("/")
        return self._entries.get(normalized_path)

    def list_entries(self) -> List[WorkspaceEntry]:
        return sorted(self._entries.values(), key=lambda e: e.path)

    def to_json_bytes(self) -> bytes:
        data = {
            "format": "SecureWorkspaceCatalog_v1",
            "entries": [asdict(e) for e in self.list_entries()],
        }
        return json.dumps(data, indent=2, sort_keys=True).encode("utf-8")

    @classmethod
    def from_json_bytes(cls, raw_json: bytes) -> "WorkspaceCatalog":
        data = json.loads(raw_json.decode("utf-8"))
        entries = {}
        for item in data.get("entries", []):
            entry = WorkspaceEntry(**item)
            entries[entry.path] = entry
        return cls(entries)

    def serialize_encrypted(self, wmk: bytes) -> bytes:
        """
        Encrypts the catalog JSON using the index key derived from WMK.
        Returns ciphertext bytes.
        """
        index_key = derive_index_key(wmk)
        encryptor = SecretStreamEncryptor(index_key)

        source = io.BytesIO(self.to_json_bytes())
        dest = io.BytesIO()
        encryptor.encrypt(source, dest)
        return dest.getvalue()

    @classmethod
    def deserialize_encrypted(cls, ciphertext: bytes, wmk: bytes) -> "WorkspaceCatalog":
        """
        Decrypts an encrypted catalog using the index key derived from WMK.
        Returns WorkspaceCatalog instance.
        """
        index_key = derive_index_key(wmk)
        decryptor = SecretStreamDecryptor(index_key)

        source = io.BytesIO(ciphertext)
        dest = io.BytesIO()
        decryptor.decrypt(source, dest)
        return cls.from_json_bytes(dest.getvalue())
