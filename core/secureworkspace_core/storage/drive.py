"""
Production Google Drive Storage Adapter for SecureWorkspace.
Implements Google Drive REST API v3 using plain requests with:
- Resumable chunked uploads (256 KiB aligned) for large files
- Multipart uploads for small files (< 5 MB)
- Token Provider callback pattern with auto-refresh on 401
- Exponential backoff with randomized jitter on HTTP 429 and 5xx
- Strict folder boundary enforcement (refuses any operations outside SecureWorkspace root)
"""

import json
import os
from typing import Any, Callable, Dict, List, Optional
import requests

from secureworkspace_core.storage.adapter import (
    AuthenticationError,
    FileNotFoundOnStorageError,
    FolderBoundaryViolationError,
    RemoteFile,
    StorageAdapter,
    StorageError,
)
from secureworkspace_core.storage.retry import retry_call

DRIVE_API_BASE = "https://www.googleapis.com/drive/v3"
DRIVE_UPLOAD_BASE = "https://www.googleapis.com/upload/drive/v3"

# Google Drive requires resumable chunk sizes to be exact multiples of 256 KiB (262,144 bytes)
RESUMABLE_CHUNK_SIZE = 1024 * 1024  # 1 MiB (4 * 256 KiB)
RESUMABLE_THRESHOLD = 5 * 1024 * 1024  # 5 MiB threshold to switch to resumable


class GoogleDriveStorageAdapter(StorageAdapter):
    """Production Google Drive storage adapter implementing StorageAdapter."""

    def __init__(
        self,
        token_provider: Callable[[], str],
        app_folder_name: str = "SecureWorkspace",
        app_folder_id: Optional[str] = None,
        session: Optional[requests.Session] = None,
    ):
        self.token_provider = token_provider
        self.app_folder_name = app_folder_name
        self.app_folder_id = app_folder_id
        self.session = session or requests.Session()

    def _request_with_token(
        self,
        method: str,
        url: str,
        headers: Optional[Dict[str, str]] = None,
        **kwargs: Any,
    ) -> requests.Response:
        """
        Executes an HTTP request with the current access token.
        If a 401 Unauthorized occurs, requests a fresh token and retries once.
        Applies exponential backoff for transient errors.
        """
        req_headers = headers.copy() if headers else {}
        token = self.token_provider()
        req_headers["Authorization"] = f"Bearer {token}"

        def _do_request():
            res = self.session.request(method, url, headers=req_headers, **kwargs)
            return res

        res = retry_call(_do_request)

        # Handle 401 Unauthorized (expired token)
        if res.status_code == 401:
            # Refresh token once
            token = self.token_provider()
            req_headers["Authorization"] = f"Bearer {token}"
            res = retry_call(lambda: self.session.request(method, url, headers=req_headers, **kwargs))
            if res.status_code == 401:
                raise AuthenticationError("Authentication failed: token expired or revoked.")

        return res

    def ensure_app_folder(self) -> str:
        """Finds or creates the isolated SecureWorkspace folder."""
        if self.app_folder_id:
            return self.app_folder_id

        query = (
            f"name = '{self.app_folder_name}' and "
            "mimeType = 'application/vnd.google-apps.folder' and "
            "trashed = false"
        )
        url = f"{DRIVE_API_BASE}/files"
        res = self._request_with_token("GET", url, params={"q": query, "fields": "files(id, name, appProperties)"})
        res.raise_for_status()

        files = res.json().get("files", [])
        if files:
            self.app_folder_id = files[0]["id"]
            return self.app_folder_id

        # Create folder
        create_body = {
            "name": self.app_folder_name,
            "mimeType": "application/vnd.google-apps.folder",
            "appProperties": {"app": "SecureWorkspace"},
        }
        create_res = self._request_with_token("POST", url, json=create_body)
        create_res.raise_for_status()
        self.app_folder_id = create_res.json()["id"]
        return self.app_folder_id

    def verify_file_in_app_folder(self, remote_id: str) -> RemoteFile:
        """
        Enforces strict boundary security:
        Verifies that the target file belongs exclusively to the app folder.
        Raises FolderBoundaryViolationError if not.
        """
        app_folder = self.ensure_app_folder()
        url = f"{DRIVE_API_BASE}/files/{remote_id}"
        res = self._request_with_token(
            "GET", url, params={"fields": "id, name, size, md5Checksum, modifiedTime, parents, mimeType, appProperties"}
        )
        if res.status_code == 404:
            raise FileNotFoundOnStorageError(f"File not found on Drive: {remote_id}")
        res.raise_for_status()

        data = res.json()
        parents = data.get("parents", [])
        if app_folder not in parents and remote_id != app_folder:
            raise FolderBoundaryViolationError(
                f"Security violation: file '{data.get('name')}' (ID: {remote_id}) "
                f"has parents {parents}, which is outside the SecureWorkspace folder '{app_folder}'."
            )

        return RemoteFile(
            id=data["id"],
            name=data["name"],
            size=int(data.get("size", 0)),
            modified_time=data.get("modifiedTime", ""),
            parent_id=parents[0] if parents else None,
            is_folder=data.get("mimeType") == "application/vnd.google-apps.folder",
            md5_checksum=data.get("md5Checksum"),
            app_properties=data.get("appProperties", {}),
        )

    def list_files(self, folder_id: Optional[str] = None) -> List[RemoteFile]:
        target_folder = folder_id or self.ensure_app_folder()
        query = f"'{target_folder}' in parents and trashed = false"

        results = []
        page_token = None

        while True:
            params: Dict[str, Any] = {
                "q": query,
                "fields": "nextPageToken, files(id, name, size, md5Checksum, modifiedTime, parents, mimeType, appProperties)",
                "pageSize": 1000,
            }
            if page_token:
                params["pageToken"] = page_token

            res = self._request_with_token("GET", f"{DRIVE_API_BASE}/files", params=params)
            res.raise_for_status()
            data = res.json()

            for item in data.get("files", []):
                results.append(
                    RemoteFile(
                        id=item["id"],
                        name=item["name"],
                        size=int(item.get("size", 0)),
                        modified_time=item.get("modifiedTime", ""),
                        parent_id=target_folder,
                        is_folder=item.get("mimeType") == "application/vnd.google-apps.folder",
                        md5_checksum=item.get("md5Checksum"),
                        app_properties=item.get("appProperties", {}),
                    )
                )

            page_token = data.get("nextPageToken")
            if not page_token:
                break

        return results

    def upload_file(
        self,
        local_path: str,
        remote_name: str,
        folder_id: Optional[str] = None,
        progress_callback: Optional[Callable[[int, int], None]] = None,
    ) -> RemoteFile:
        target_folder = folder_id or self.ensure_app_folder()
        file_size = os.path.getsize(local_path)

        if file_size < RESUMABLE_THRESHOLD:
            # Multipart upload
            with open(local_path, "rb") as f:
                data = f.read()
            res = self.upload_bytes(data, remote_name, folder_id=target_folder)
            if progress_callback:
                progress_callback(file_size, file_size)
            return res

        # Resumable upload for files >= 5MB
        return self._upload_resumable(local_path, remote_name, target_folder, file_size, progress_callback)

    def _upload_resumable(
        self,
        local_path: str,
        remote_name: str,
        folder_id: str,
        total_size: int,
        progress_callback: Optional[Callable[[int, int], None]] = None,
    ) -> RemoteFile:
        # Step 1: Initiate session
        metadata = {"name": remote_name, "parents": [folder_id], "appProperties": {"app": "SecureWorkspace"}}
        init_headers = {
            "Content-Type": "application/json; charset=UTF-8",
            "X-Upload-Content-Type": "application/octet-stream",
            "X-Upload-Content-Length": str(total_size),
        }
        init_url = f"{DRIVE_UPLOAD_BASE}/files?uploadType=resumable"
        init_res = self._request_with_token("POST", init_url, headers=init_headers, json=metadata)
        init_res.raise_for_status()

        session_url = init_res.headers.get("Location")
        if not session_url:
            raise StorageError("Drive API failed to return resumable upload Location header.")

        # Step 2: Upload chunks
        bytes_uploaded = 0
        with open(local_path, "rb") as f:
            while bytes_uploaded < total_size:
                chunk = f.read(RESUMABLE_CHUNK_SIZE)
                chunk_len = len(chunk)
                start = bytes_uploaded
                end = bytes_uploaded + chunk_len - 1

                chunk_headers = {
                    "Content-Length": str(chunk_len),
                    "Content-Range": f"bytes {start}-{end}/{total_size}",
                }

                chunk_res = self._request_with_token("PUT", session_url, headers=chunk_headers, data=chunk)

                if chunk_res.status_code in (200, 201):
                    # Finished
                    data = chunk_res.json()
                    if progress_callback:
                        progress_callback(total_size, total_size)
                    return RemoteFile(
                        id=data["id"],
                        name=data["name"],
                        size=int(data.get("size", total_size)),
                        modified_time=data.get("modifiedTime", ""),
                        parent_id=folder_id,
                        app_properties=data.get("appProperties", {}),
                    )

                if chunk_res.status_code == 308:
                    bytes_uploaded += chunk_len
                    if progress_callback:
                        progress_callback(bytes_uploaded, total_size)
                else:
                    chunk_res.raise_for_status()

        raise StorageError("Upload loop completed without receiving final 200/201 response.")

    def upload_bytes(
        self,
        data: bytes,
        remote_name: str,
        folder_id: Optional[str] = None,
    ) -> RemoteFile:
        target_folder = folder_id or self.ensure_app_folder()
        metadata = {
            "name": remote_name,
            "parents": [target_folder],
            "appProperties": {"app": "SecureWorkspace"},
        }

        files = {
            "data": ("metadata", json.dumps(metadata), "application/json; charset=UTF-8"),
            "file": (remote_name, data, "application/octet-stream"),
        }
        url = f"{DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,size,md5Checksum,modifiedTime,parents,appProperties"
        res = self._request_with_token("POST", url, files=files)
        res.raise_for_status()

        resp_data = res.json()
        return RemoteFile(
            id=resp_data["id"],
            name=resp_data["name"],
            size=int(resp_data.get("size", len(data))),
            modified_time=resp_data.get("modifiedTime", ""),
            parent_id=target_folder,
            md5_checksum=resp_data.get("md5Checksum"),
            app_properties=resp_data.get("appProperties", {}),
        )

    def download_file(
        self,
        remote_id: str,
        local_path: str,
        progress_callback: Optional[Callable[[int, int], None]] = None,
    ) -> None:
        meta = self.verify_file_in_app_folder(remote_id)
        total_size = meta.size

        url = f"{DRIVE_API_BASE}/files/{remote_id}?alt=media"
        res = self._request_with_token("GET", url, stream=True)
        res.raise_for_status()

        os.makedirs(os.path.dirname(os.path.abspath(local_path)), exist_ok=True)
        bytes_received = 0

        with open(local_path, "wb") as f:
            for chunk in res.iter_content(chunk_size=64 * 1024):
                if chunk:
                    f.write(chunk)
                    bytes_received += len(chunk)
                    if progress_callback:
                        progress_callback(bytes_received, total_size)

    def download_bytes(self, remote_id: str) -> bytes:
        self.verify_file_in_app_folder(remote_id)
        url = f"{DRIVE_API_BASE}/files/{remote_id}?alt=media"
        res = self._request_with_token("GET", url)
        res.raise_for_status()
        return res.content

    def delete_file(self, remote_id: str) -> None:
        self.verify_file_in_app_folder(remote_id)
        url = f"{DRIVE_API_BASE}/files/{remote_id}"
        res = self._request_with_token("DELETE", url)
        res.raise_for_status()

    def get_metadata(self, remote_id: str) -> RemoteFile:
        return self.verify_file_in_app_folder(remote_id)
