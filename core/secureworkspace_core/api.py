"""
Unified Core Public API Facade for SecureWorkspace.
Implements the JSON-in / JSON-out contract specified in PRD Section 7.
Bridges Desktop (PySide6) and Mobile (Chaquopy / Kotlin / React Native).
"""

from dataclasses import asdict
import json
import os
from pathlib import Path
import shutil
import time
from typing import Any, Callable, Dict, List, Optional
import uuid

import nacl.utils
from nacl.exceptions import CryptoError

from secureworkspace_core.constants import KEY_BYTES
from secureworkspace_core.auth import GoogleOAuthManager
from secureworkspace_core.crypto.kdf import (
    DEFAULT_MEMLIMIT,
    DEFAULT_OPSLIMIT,
    derive_kek_from_password,
    derive_kek_from_recovery_entropy,
)
from secureworkspace_core.crypto.keys import derive_meta_key, wrap_wmk
from secureworkspace_core.crypto.recovery import (
    generate_recovery_phrase,
    phrase_to_entropy,
)
from secureworkspace_core.storage.adapter import (
    AuthenticationError,
    FileNotFoundOnStorageError,
    FolderBoundaryViolationError,
    RateLimitError,
    RemoteFile,
    StorageAdapter,
    StorageError,
)
from secureworkspace_core.sync.errors import (
    ConcurrentPushError,
    DivergedWorkspaceError,
    DriveAheadError,
    ManifestNotFoundError,
    MassDeletionGuardError,
    SyncError,
)
from secureworkspace_core.sync.manifest import (
    RemoteManifestManager,
    VersionManifest,
)
from secureworkspace_core.sync.pull import PullEngine
from secureworkspace_core.sync.push import PushEngine
from secureworkspace_core.sync.revert import (
    force_push,
    restore_file_version,
    revert_workspace,
)
from secureworkspace_core.sync.status import StatusEngine
from secureworkspace_core.workspace.change_detector import ChangeDetector
from secureworkspace_core.workspace.db import FileRecord, normalize_path
from secureworkspace_core.workspace.header import WorkspaceHeader
from secureworkspace_core.workspace.manager import (
    WorkspaceLockedError,
    WorkspaceManager,
)


class APIErrorCode:
    SUCCESS = "SUCCESS"
    NOT_UNLOCKED = "NOT_UNLOCKED"
    ALREADY_UNLOCKED = "ALREADY_UNLOCKED"
    HEADER_NOT_FOUND = "HEADER_NOT_FOUND"
    WRONG_PASSWORD = "WRONG_PASSWORD"
    FILE_NOT_FOUND = "FILE_NOT_FOUND"
    STORAGE_NOT_CONNECTED = "STORAGE_NOT_CONNECTED"
    DRIVE_AHEAD = "DRIVE_AHEAD"
    CONCURRENT_PUSH = "CONCURRENT_PUSH"
    MASS_DELETION_GUARD = "MASS_DELETION_GUARD"
    WORKSPACE_LOCKED = "WORKSPACE_LOCKED"
    INTEGRITY_ERROR = "INTEGRITY_ERROR"
    INVALID_ARGUMENT = "INVALID_ARGUMENT"
    INTERNAL_ERROR = "INTERNAL_ERROR"
    AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR"


def success_response(data: Any = None, message: str = "") -> Dict[str, Any]:
    """Formats standard JSON success envelope."""
    res: Dict[str, Any] = {"success": True}
    if message:
        res["message"] = message
    if data is not None:
        res["data"] = data
    return res


def error_response(error_code: str, message: str) -> Dict[str, Any]:
    """Formats standard JSON error envelope."""
    return {
        "success": False,
        "error_code": error_code,
        "message": message,
    }


class SecureWorkspaceAPI:
    """
    Stateful API session facade.
    Implements all operations specified in PRD Section 7.
    """

    HEADER_FILENAME = "workspace.header"

    def __init__(self, oauth_manager: Optional[GoogleOAuthManager] = None):
        self._workspace_path: Optional[Path] = None
        self._header: Optional[WorkspaceHeader] = None
        self._wmk: Optional[bytes] = None
        self._meta_key: Optional[bytes] = None
        self._manager: Optional[WorkspaceManager] = None
        self._storage: Optional[StorageAdapter] = None
        self._manifest_manager: Optional[RemoteManifestManager] = None
        self._status_engine: Optional[StatusEngine] = None
        self._push_engine: Optional[PushEngine] = None
        self._pull_engine: Optional[PullEngine] = None
        self._oauth_manager: GoogleOAuthManager = oauth_manager or GoogleOAuthManager()

    def _require_unlocked(self) -> None:
        if self._wmk is None or self._manager is None:
            raise ValueError("WORKSPACE_LOCKED: Workspace must be unlocked before performing this operation.")

    def _require_storage(self) -> None:
        if self._storage is None or self._manifest_manager is None:
            raise ValueError("STORAGE_NOT_CONNECTED: Remote storage is not connected.")

    def _init_sync_engines(self) -> None:
        if self._storage is not None and self._wmk is not None and self._manager is not None:
            self._manifest_manager = RemoteManifestManager(self._storage, self._wmk)
            self._status_engine = StatusEngine(self._manager, self._manifest_manager)
            self._push_engine = PushEngine(self._manager, self._manifest_manager)
            self._pull_engine = PullEngine(self._manager, self._manifest_manager)

    # -------------------------------------------------------------------------
    # Workspace & Key Lifecycle (PRD FR-01, Flows 1, 10, 11)
    # -------------------------------------------------------------------------

    def workspace_create(
        self, workspace_path: str, name: str, password: str
    ) -> Dict[str, Any]:
        """
        Creates a new encrypted workspace.
        Generates 256-bit WMK, derives dual-path KEKs, creates workspace.header,
        initializes directory layout, and returns 24-word recovery phrase.
        """
        if not workspace_path:
            return error_response(APIErrorCode.INVALID_ARGUMENT, "workspace_path cannot be empty.")
        if not name or not name.strip():
            return error_response(APIErrorCode.INVALID_ARGUMENT, "Workspace name cannot be empty.")
        if len(password) < 8:
            return error_response(APIErrorCode.INVALID_ARGUMENT, "Password must be at least 8 characters long.")

        ws_dir = Path(workspace_path).resolve()
        ws_dir.mkdir(parents=True, exist_ok=True)
        header_path = ws_dir / self.HEADER_FILENAME

        if header_path.is_file():
            return error_response(
                APIErrorCode.INVALID_ARGUMENT,
                f"A workspace already exists at '{workspace_path}'.",
            )

        header, recovery_phrase, wmk = WorkspaceHeader.create(name=name.strip(), password=password)
        header_path.write_bytes(header.to_bytes())

        meta_key = derive_meta_key(wmk)
        manager = WorkspaceManager(ws_dir, meta_key=meta_key)
        manager.init_workspace()
        manager.lock()

        # Keep active session
        self._workspace_path = ws_dir
        self._header = header
        self._wmk = wmk
        self._meta_key = meta_key
        self._manager = manager
        self._init_sync_engines()

        return success_response(
            data={
                "workspace_id": header.workspace_id.hex(),
                "name": header.name,
                "recovery_phrase": recovery_phrase,
                "workspace_path": str(ws_dir),
            },
            message="Workspace created and unlocked successfully.",
        )

    def verify_recovery_test(self, recovery_phrase: str) -> Dict[str, Any]:
        """
        Enforces PRD Flow 1 Step 9: verifies typed words match the recovery key.
        """
        if not self._header or not self._wmk:
            return error_response(APIErrorCode.NOT_UNLOCKED, "Workspace session not active.")

        try:
            unwrapped = self._header.unlock_with_recovery_key(recovery_phrase.strip())
            if unwrapped == self._wmk:
                return success_response(data={"verified": True}, message="Recovery test passed.")
            return error_response(APIErrorCode.WRONG_PASSWORD, "Recovery phrase did not match.")
        except Exception:
            return error_response(APIErrorCode.WRONG_PASSWORD, "Recovery phrase verification failed.")

    def workspace_unlock(
        self, workspace_path: str, password_or_recovery_key: str
    ) -> Dict[str, Any]:
        """
        Derives keys and opens an unlocked session with password or 24-word recovery phrase.
        """
        if self._wmk is not None:
            return error_response(APIErrorCode.ALREADY_UNLOCKED, "A workspace is already unlocked. Lock it first.")

        ws_dir = Path(workspace_path).resolve()
        header_path = ws_dir / self.HEADER_FILENAME
        if not header_path.is_file():
            return error_response(
                APIErrorCode.HEADER_NOT_FOUND,
                f"Workspace header not found at '{header_path}'.",
            )

        header_bytes = header_path.read_bytes()
        try:
            header = WorkspaceHeader.from_bytes(header_bytes)
        except Exception as e:
            return error_response(APIErrorCode.INTEGRITY_ERROR, f"Invalid or corrupted workspace header: {e}")

        # Try password or recovery key
        token = password_or_recovery_key.strip()
        words = token.split()
        wmk: Optional[bytes] = None

        if len(words) == 24:
            # 24-word recovery phrase
            try:
                wmk = header.unlock_with_recovery_key(token)
            except CryptoError:
                pass

        if wmk is None:
            # Try as password
            try:
                wmk = header.unlock_with_password(token)
            except CryptoError:
                pass

        if wmk is None:
            return error_response(APIErrorCode.WRONG_PASSWORD, "That password or recovery key did not work.")

        meta_key = derive_meta_key(wmk)
        manager = WorkspaceManager(ws_dir, meta_key=meta_key)
        try:
            manager.init_workspace()
            manager.lock()
        except WorkspaceLockedError as e:
            return error_response(APIErrorCode.WORKSPACE_LOCKED, str(e))

        self._workspace_path = ws_dir
        self._header = header
        self._wmk = wmk
        self._meta_key = meta_key
        self._manager = manager
        self._init_sync_engines()

        return success_response(
            data={
                "workspace_id": header.workspace_id.hex(),
                "name": header.name,
                "workspace_path": str(ws_dir),
            },
            message=f"Workspace '{header.name}' unlocked successfully.",
        )

    def workspace_lock(self) -> Dict[str, Any]:
        """Wipes keys from memory, cleans temporary files, and closes database."""
        if self._manager:
            try:
                self._manager.temp_manager.cleanup_all()
            except Exception:
                pass
            self._manager.close()

        self._workspace_path = None
        self._header = None
        self._wmk = None
        self._meta_key = None
        self._manager = None
        self._manifest_manager = None
        self._status_engine = None
        self._push_engine = None
        self._pull_engine = None

        return success_response(data={"locked": True}, message="Workspace locked.")

    def is_unlocked(self) -> Dict[str, Any]:
        """Returns current unlock status."""
        unlocked = self._wmk is not None and self._manager is not None
        return success_response(
            data={
                "is_unlocked": unlocked,
                "workspace_path": str(self._workspace_path) if self._workspace_path else None,
                "name": self._header.name if self._header else None,
            }
        )

    def change_password(self, new_password: str) -> Dict[str, Any]:
        """
        Re-wraps the WMK with a new master password without re-encrypting file data (PRD Flow 10).
        """
        try:
            self._require_unlocked()
        except ValueError as e:
            return error_response(APIErrorCode.NOT_UNLOCKED, str(e))

        if len(new_password) < 8:
            return error_response(APIErrorCode.INVALID_ARGUMENT, "New password must be at least 8 characters long.")

        new_salt = nacl.utils.random(16)
        new_kek = derive_kek_from_password(
            new_password,
            new_salt,
            opslimit=self._header.opslimit,
            memlimit=self._header.memlimit,
        )
        new_nonce, new_wrapped = wrap_wmk(self._wmk, new_kek)

        self._header.password_salt = new_salt
        self._header.password_nonce = new_nonce
        self._header.wrapped_wmk_password = new_wrapped

        header_bytes = self._header.to_bytes()
        header_file = self._workspace_path / self.HEADER_FILENAME
        header_file.write_bytes(header_bytes)

        if self._storage is not None:
            try:
                self._storage.upload_bytes(header_bytes, self.HEADER_FILENAME)
            except Exception:
                pass

        return success_response(message="Master password changed successfully.")

    def regenerate_recovery_phrase(self) -> Dict[str, Any]:
        """
        Generates a new 24-word recovery phrase and re-wraps the WMK (PRD Flow 10).
        """
        try:
            self._require_unlocked()
        except ValueError as e:
            return error_response(APIErrorCode.NOT_UNLOCKED, str(e))

        new_phrase = generate_recovery_phrase()
        new_entropy = phrase_to_entropy(new_phrase)
        new_salt = nacl.utils.random(16)
        new_kek = derive_kek_from_recovery_entropy(
            new_entropy,
            new_salt,
            opslimit=self._header.opslimit,
            memlimit=self._header.memlimit,
        )
        new_nonce, new_wrapped = wrap_wmk(self._wmk, new_kek)

        self._header.recovery_salt = new_salt
        self._header.recovery_nonce = new_nonce
        self._header.wrapped_wmk_recovery = new_wrapped

        header_bytes = self._header.to_bytes()
        header_file = self._workspace_path / self.HEADER_FILENAME
        header_file.write_bytes(header_bytes)

        if self._storage is not None:
            try:
                self._storage.upload_bytes(header_bytes, self.HEADER_FILENAME)
            except Exception:
                pass

        return success_response(
            data={"new_recovery_phrase": new_phrase},
            message="New recovery phrase generated and active.",
        )

    # -------------------------------------------------------------------------
    # File Management (PRD FR-02, Flows 3, 4, 11)
    # -------------------------------------------------------------------------

    def list_files(self, subpath: str = "") -> Dict[str, Any]:
        """
        Returns decrypted view of active files from the zero-plaintext SQLite metadata engine.
        """
        try:
            self._require_unlocked()
        except ValueError as e:
            return error_response(APIErrorCode.NOT_UNLOCKED, str(e))

        norm_sub = normalize_path(subpath)
        all_files = self._manager.db.list_files()
        active = []
        for f in all_files:
            if f.sync_status != "DELETED":
                if not norm_sub or f.path.startswith(norm_sub):
                    active.append(
                        {
                            "file_id": f.file_id,
                            "path": f.path,
                            "size": f.size,
                            "mtime_ms": f.mtime_ms,
                            "sha256": f.sha256,
                            "sync_status": f.sync_status,
                            "updated_at_ms": f.updated_at_ms,
                        }
                    )

        return success_response(data={"files": active, "count": len(active)})

    def add_file(self, source_path: str, dest_rel_path: str) -> Dict[str, Any]:
        """
        Copies a local file into the workspace.
        """
        try:
            self._require_unlocked()
        except ValueError as e:
            return error_response(APIErrorCode.NOT_UNLOCKED, str(e))

        src = Path(source_path).resolve()
        if not src.is_file():
            return error_response(APIErrorCode.FILE_NOT_FOUND, f"Source file not found: {source_path}")

        norm_dest = normalize_path(dest_rel_path)
        dest = self._manager.root_path / norm_dest
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dest)

        return success_response(
            data={"path": norm_dest, "size": dest.stat().st_size},
            message=f"Added file '{norm_dest}' to workspace.",
        )

    def open_file(self, rel_path: str) -> Dict[str, Any]:
        """
        Decrypts / stages file into a managed temp location for external editing (PRD Flow 4).
        Returns the path to the staged file.
        """
        try:
            self._require_unlocked()
        except ValueError as e:
            return error_response(APIErrorCode.NOT_UNLOCKED, str(e))

        norm_path = normalize_path(rel_path)
        source_file = self._manager.root_path / norm_path
        if not source_file.is_file():
            return error_response(APIErrorCode.FILE_NOT_FOUND, f"File does not exist: {rel_path}")

        temp_file = self._manager.temp_manager.create_temp_file(
            prefix=f"sw_open_{uuid.uuid4().hex[:6]}_",
            suffix=f"_{source_file.name}",
        )
        shutil.copy2(source_file, temp_file)

        return success_response(
            data={
                "temp_path": str(temp_file),
                "original_path": norm_path,
            },
            message="File staged in temporary location for editing.",
        )

    def save_file(self, rel_path: str, edited_source_path: str) -> Dict[str, Any]:
        """
        Saves changes from an edited temp file back into the workspace as an unpushed change.
        Securely removes the temp file.
        """
        try:
            self._require_unlocked()
        except ValueError as e:
            return error_response(APIErrorCode.NOT_UNLOCKED, str(e))

        edited = Path(edited_source_path).resolve()
        if not edited.is_file():
            return error_response(APIErrorCode.FILE_NOT_FOUND, f"Edited source not found: {edited_source_path}")

        norm_path = normalize_path(rel_path)
        dest = self._manager.root_path / norm_path
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(edited, dest)

        # Securely delete the temp file
        self._manager.temp_manager.secure_delete(edited)

        return success_response(
            data={"path": norm_path, "size": dest.stat().st_size},
            message=f"Saved changes to '{norm_path}'.",
        )

    def delete_file(self, rel_path: str) -> Dict[str, Any]:
        """Deletes a file locally and marks it as DELETED in the database."""
        try:
            self._require_unlocked()
        except ValueError as e:
            return error_response(APIErrorCode.NOT_UNLOCKED, str(e))

        norm_path = normalize_path(rel_path)
        dest = self._manager.root_path / norm_path
        if dest.is_file():
            dest.unlink(missing_ok=True)

        rec = self._manager.db.get_file_by_path(norm_path)
        if rec:
            self._manager.db.mark_file_deleted(rec.file_id)

        return success_response(
            data={"path": norm_path, "deleted": True},
            message=f"Deleted '{norm_path}' from workspace.",
        )

    def cleanup_temp(self, max_age_seconds: float = 0.0) -> Dict[str, Any]:
        """Securely zeroes out and unlinks temporary staging files."""
        try:
            self._require_unlocked()
        except ValueError as e:
            return error_response(APIErrorCode.NOT_UNLOCKED, str(e))

        cleaned = self._manager.temp_manager.cleanup_temp(max_age_seconds)
        return success_response(data={"cleaned_count": cleaned})

    # -------------------------------------------------------------------------
    # Git-Style Remote Sync & OAuth (PRD FR-04, Flows 2, 5, 6, 7)
    # -------------------------------------------------------------------------

    def connect_storage(self, storage_adapter: StorageAdapter) -> Dict[str, Any]:
        """Attaches a StorageAdapter (GoogleDriveStorageAdapter or MockStorageAdapter)."""
        self._storage = storage_adapter
        self._init_sync_engines()
        return success_response(message="Storage adapter connected.")

    def google_auth_status(self, auto_connect: bool = True) -> Dict[str, Any]:
        """
        Queries Google OAuth authentication status.
        If authenticated and auto_connect is True, automatically attaches
        GoogleDriveStorageAdapter via self.connect_storage().
        """
        if not self._oauth_manager.is_authenticated():
            return success_response(
                data={
                    "authenticated": False,
                    "email": None,
                    "name": None,
                    "picture": None,
                    "storage_connected": self._storage is not None,
                }
            )

        user_info: Dict[str, Any] = {}
        try:
            user_info = self._oauth_manager.get_user_info()
        except Exception:
            pass

        if auto_connect and self._storage is None:
            try:
                adapter = self._oauth_manager.create_storage_adapter()
                self.connect_storage(adapter)
            except Exception:
                pass

        return success_response(
            data={
                "authenticated": True,
                "email": user_info.get("email"),
                "name": user_info.get("name"),
                "picture": user_info.get("picture"),
                "storage_connected": self._storage is not None,
            }
        )

    def google_auth_login(self, port: int = 0) -> Dict[str, Any]:
        """
        Initiates Google OAuth local browser authentication flow.
        Upon authorization, attaches GoogleDriveStorageAdapter to the active session.
        """
        try:
            auth_data = self._oauth_manager.login(port=port)
            adapter = self._oauth_manager.create_storage_adapter()
            self.connect_storage(adapter)
            return success_response(
                data={
                    "authenticated": True,
                    "email": auth_data.get("email"),
                    "name": auth_data.get("name"),
                    "picture": auth_data.get("picture"),
                    "storage_connected": True,
                },
                message="Google Drive authenticated successfully.",
            )
        except Exception as e:
            return error_response(
                APIErrorCode.AUTHENTICATION_ERROR,
                f"OAuth login failed: {e}",
            )

    def google_auth_logout(self) -> Dict[str, Any]:
        """Disconnects Google account and clears local credentials."""
        self._oauth_manager.logout()
        self._storage = None
        self._manifest_manager = None
        self._status_engine = None
        self._push_engine = None
        self._pull_engine = None
        return success_response(
            data={"authenticated": False, "storage_connected": False},
            message="Google Drive disconnected.",
        )

    def status(self, quick: bool = False) -> Dict[str, Any]:
        """
        Strictly read-only status check:
        Reports unpushed local changes, remote versions ahead, and diverged state.
        """
        try:
            self._require_unlocked()
            self._require_storage()
        except ValueError as e:
            code = APIErrorCode.NOT_UNLOCKED if "LOCKED" in str(e) else APIErrorCode.STORAGE_NOT_CONNECTED
            return error_response(code, str(e))

        try:
            st = self._status_engine.status(quick=quick)
            return success_response(data=st.to_dict())
        except Exception as e:
            return error_response(APIErrorCode.INTERNAL_ERROR, f"Status check failed: {e}")

    def pull_preview(self) -> Dict[str, Any]:
        """Previews what pull will download, delete, or snapshot."""
        try:
            self._require_unlocked()
            self._require_storage()
        except ValueError as e:
            code = APIErrorCode.NOT_UNLOCKED if "LOCKED" in str(e) else APIErrorCode.STORAGE_NOT_CONNECTED
            return error_response(code, str(e))

        try:
            prev = self._pull_engine.pull_preview()
            return success_response(data=prev.to_dict())
        except Exception as e:
            return error_response(APIErrorCode.INTERNAL_ERROR, f"Pull preview failed: {e}")

    def pull(self, confirm: bool = True) -> Dict[str, Any]:
        """
        Pulls remote HEAD changes:
        Takes safety snapshots of modified/deleted files, downloads objects, and updates DB.
        """
        try:
            self._require_unlocked()
            self._require_storage()
        except ValueError as e:
            code = APIErrorCode.NOT_UNLOCKED if "LOCKED" in str(e) else APIErrorCode.STORAGE_NOT_CONNECTED
            return error_response(code, str(e))

        try:
            res = self._pull_engine.pull(confirm=confirm)
            return success_response(data=asdict(res), message=res.message)
        except Exception as e:
            return error_response(APIErrorCode.INTERNAL_ERROR, f"Pull failed: {e}")

    def push_preview(self) -> Dict[str, Any]:
        """Previews push changes and verifies remote is not ahead."""
        try:
            self._require_unlocked()
            self._require_storage()
        except ValueError as e:
            code = APIErrorCode.NOT_UNLOCKED if "LOCKED" in str(e) else APIErrorCode.STORAGE_NOT_CONNECTED
            return error_response(code, str(e))

        try:
            prev = self._push_engine.push_preview()
            return success_response(data=prev.to_dict())
        except Exception as e:
            return error_response(APIErrorCode.INTERNAL_ERROR, f"Push preview failed: {e}")

    def push(
        self,
        message: str = "",
        confirm_mass_deletion: bool = False,
        device_id: str = "desktop",
    ) -> Dict[str, Any]:
        """
        Pushes local changes as a new numbered version to Drive.
        """
        try:
            self._require_unlocked()
            self._require_storage()
        except ValueError as e:
            code = APIErrorCode.NOT_UNLOCKED if "LOCKED" in str(e) else APIErrorCode.STORAGE_NOT_CONNECTED
            return error_response(code, str(e))

        try:
            res = self._push_engine.push(
                message=message,
                confirm_mass_deletion=confirm_mass_deletion,
                device_id=device_id,
            )
            return success_response(data=asdict(res), message=res.message)
        except DriveAheadError as e:
            return error_response(APIErrorCode.DRIVE_AHEAD, str(e))
        except MassDeletionGuardError as e:
            return error_response(APIErrorCode.MASS_DELETION_GUARD, str(e))
        except ConcurrentPushError as e:
            return error_response(APIErrorCode.CONCURRENT_PUSH, str(e))
        except Exception as e:
            return error_response(APIErrorCode.INTERNAL_ERROR, f"Push failed: {e}")

    def force_push(
        self,
        message: str = "Force push",
        confirm: bool = False,
        device_id: str = "desktop",
    ) -> Dict[str, Any]:
        """
        Forces local changes as latest version even if remote is ahead.
        """
        try:
            self._require_unlocked()
            self._require_storage()
        except ValueError as e:
            code = APIErrorCode.NOT_UNLOCKED if "LOCKED" in str(e) else APIErrorCode.STORAGE_NOT_CONNECTED
            return error_response(code, str(e))

        try:
            res = force_push(
                self._push_engine,
                message=message,
                confirm=confirm,
                device_id=device_id,
            )
            return success_response(data=asdict(res), message=res.message)
        except Exception as e:
            return error_response(APIErrorCode.INTERNAL_ERROR, f"Force push failed: {e}")

    def list_remote_versions(self) -> Dict[str, Any]:
        """Lists historical Drive versions in descending order."""
        try:
            self._require_unlocked()
            self._require_storage()
        except ValueError as e:
            code = APIErrorCode.NOT_UNLOCKED if "LOCKED" in str(e) else APIErrorCode.STORAGE_NOT_CONNECTED
            return error_response(code, str(e))

        try:
            manifests = self._manifest_manager.list_remote_versions()
            return success_response(data={"versions": [m.to_dict() for m in manifests]})
        except Exception as e:
            return error_response(APIErrorCode.INTERNAL_ERROR, f"Listing versions failed: {e}")

    def revert(self, version_number: int, confirm: bool = True) -> Dict[str, Any]:
        """
        Reverts the whole workspace to an earlier version (staged as unpushed change).
        """
        try:
            self._require_unlocked()
            self._require_storage()
        except ValueError as e:
            code = APIErrorCode.NOT_UNLOCKED if "LOCKED" in str(e) else APIErrorCode.STORAGE_NOT_CONNECTED
            return error_response(code, str(e))

        try:
            res = revert_workspace(
                version_number=version_number,
                manager=self._manager,
                manifest_manager=self._manifest_manager,
                confirm=confirm,
            )
            return success_response(data=asdict(res), message=res.message)
        except Exception as e:
            return error_response(APIErrorCode.INTERNAL_ERROR, f"Revert failed: {e}")

    def list_versions(self, path: str) -> Dict[str, Any]:
        """Returns the version history of a specific file."""
        try:
            self._require_unlocked()
            self._require_storage()
        except ValueError as e:
            code = APIErrorCode.NOT_UNLOCKED if "LOCKED" in str(e) else APIErrorCode.STORAGE_NOT_CONNECTED
            return error_response(code, str(e))

        norm_path = normalize_path(path)
        manifests = self._manifest_manager.list_remote_versions()
        file_history = []
        for m in manifests:
            entry = m.get_entry_by_path(norm_path)
            if entry:
                file_history.append(
                    {
                        "version_number": m.version_number,
                        "timestamp_ms": m.timestamp_ms,
                        "device_id": m.device_id,
                        "message": m.message,
                        "size": entry.size,
                        "sha256": entry.sha256,
                    }
                )

        return success_response(data={"path": norm_path, "versions": file_history})

    def restore_version(self, path: str, version_number: int) -> Dict[str, Any]:
        """Restores a single file from a past version."""
        try:
            self._require_unlocked()
            self._require_storage()
        except ValueError as e:
            code = APIErrorCode.NOT_UNLOCKED if "LOCKED" in str(e) else APIErrorCode.STORAGE_NOT_CONNECTED
            return error_response(code, str(e))

        try:
            restored = restore_file_version(
                relative_path=path,
                version_number=version_number,
                manager=self._manager,
                manifest_manager=self._manifest_manager,
            )
            return success_response(
                data={"path": normalize_path(path), "version_number": version_number},
                message=f"Restored '{path}' from version {version_number}.",
            )
        except Exception as e:
            return error_response(APIErrorCode.INTERNAL_ERROR, f"Restore file failed: {e}")

    def list_safety_snapshots(self) -> Dict[str, Any]:
        """Lists local safety snapshots."""
        try:
            self._require_unlocked()
        except ValueError as e:
            return error_response(APIErrorCode.NOT_UNLOCKED, str(e))

        snaps = self._manager.list_safety_snapshots()
        return success_response(data={"snapshots": [asdict(s) for s in snaps]})

    def restore_safety_snapshot(self, snapshot_id: str) -> Dict[str, Any]:
        """Restores a local safety snapshot."""
        try:
            self._require_unlocked()
        except ValueError as e:
            return error_response(APIErrorCode.NOT_UNLOCKED, str(e))

        try:
            restored = self._manager.restore_safety_snapshot(snapshot_id)
            return success_response(
                data={"snapshot_id": snapshot_id, "restored_path": str(restored)},
                message=f"Restored safety snapshot '{snapshot_id}'.",
            )
        except Exception as e:
            return error_response(APIErrorCode.INTERNAL_ERROR, f"Snapshot restore failed: {e}")

    def delete_safety_snapshot(self, snapshot_id: str) -> Dict[str, Any]:
        """Deletes a local safety snapshot."""
        try:
            self._require_unlocked()
        except ValueError as e:
            return error_response(APIErrorCode.NOT_UNLOCKED, str(e))

        success = self._manager.delete_safety_snapshot(snapshot_id)
        return success_response(data={"snapshot_id": snapshot_id, "deleted": success})

    # -------------------------------------------------------------------------
    # Chaquopy / React Native IPC Dispatcher
    # -------------------------------------------------------------------------

    def dispatch(self, method_name: str, params_json: str = "{}") -> str:
        """
        JSON string in, JSON string out dispatcher for the Android Chaquopy bridge.
        """
        try:
            params = json.loads(params_json) if params_json else {}
        except Exception as e:
            return json.dumps(
                error_response(APIErrorCode.INVALID_ARGUMENT, f"Invalid JSON parameters: {e}")
            )

        method = getattr(self, method_name, None)
        if not method or not callable(method) or method_name.startswith("_"):
            return json.dumps(
                error_response(
                    APIErrorCode.INVALID_ARGUMENT,
                    f"Unknown API method: '{method_name}'",
                )
            )

        try:
            result = method(**params)
            return json.dumps(result)
        except TypeError as e:
            return json.dumps(
                error_response(
                    APIErrorCode.INVALID_ARGUMENT,
                    f"Invalid arguments for '{method_name}': {e}",
                )
            )
        except Exception as e:
            return json.dumps(
                error_response(
                    APIErrorCode.INTERNAL_ERROR,
                    f"Unexpected error in '{method_name}': {e}",
                )
            )
