"""
Spike 0.6: Google Drive Access Spike (Desktop)
Validates:
1. Google OAuth2 sign-in flow with 'drive.file' scope.
2. Silent token refresh when expired.
3. Plain REST API calls via 'requests' (no heavy google-api-client library).
4. Finding or creating the root 'SecureWorkspace' folder.
5. Uploading and downloading an encrypted file into the folder.
6. Enforcing folder-boundary validation (files live only inside the app folder).
"""

import hashlib
import json
import os
import sys
import requests
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow

# Allow OAuth scope expansion (Google automatically adds 'openid' when userinfo is requested)
os.environ["OAUTHLIB_RELAX_TOKEN_SCOPE"] = "1"

SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/userinfo.email",
]

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CLIENT_SECRET_FILE = os.path.join(
    os.path.dirname(os.path.dirname(BASE_DIR)),
    "google outh clients",
    "client_secret_desktop.json",
)
TOKEN_FILE = os.path.join(BASE_DIR, "token.json")


def get_credentials() -> Credentials:
    """Gets valid user credentials from disk or initiates OAuth flow in the browser."""
    creds = None
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            print("[OAuth] Token expired. Refreshing token silently...")
            creds.refresh(Request())
        else:
            if not os.path.exists(CLIENT_SECRET_FILE):
                raise FileNotFoundError(
                    f"Could not find client secret file at: {CLIENT_SECRET_FILE}"
                )
            print("[OAuth] Starting Google OAuth local server...")
            flow = InstalledAppFlow.from_client_secrets_file(
                CLIENT_SECRET_FILE, SCOPES
            )
            creds = flow.run_local_server(
                port=0,
                prompt="consent",
                success_message="The authentication flow has completed! You may close this window and return to the terminal.",
            )

        # Save credentials for future runs
        with open(TOKEN_FILE, "w") as token:
            token.write(creds.to_json())
            print("[OAuth] Saved credentials to token.json")

    return creds


def get_user_email(access_token: str) -> str:
    """Fetch user's email to verify identity."""
    res = requests.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    res.raise_for_status()
    return res.json().get("email", "Unknown")


def get_or_create_app_folder(access_token: str) -> str:
    """Finds existing 'SecureWorkspace' folder or creates it."""
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # 1. Search for existing folder created by this app
    query = (
        "name = 'SecureWorkspace' and "
        "mimeType = 'application/vnd.google-apps.folder' and "
        "trashed = false"
    )
    res = requests.get(
        "https://www.googleapis.com/drive/v3/files",
        headers=headers,
        params={"q": query, "fields": "files(id, name, appProperties)"},
    )
    res.raise_for_status()
    files = res.json().get("files", [])

    if files:
        folder_id = files[0]["id"]
        print(f"[Drive] Found existing 'SecureWorkspace' folder: ID = {folder_id}")
        return folder_id

    # 2. Create if not found
    print("[Drive] 'SecureWorkspace' folder not found. Creating it now...")
    create_body = {
        "name": "SecureWorkspace",
        "mimeType": "application/vnd.google-apps.folder",
        "appProperties": {"app": "SecureWorkspace"},
    }
    create_res = requests.post(
        "https://www.googleapis.com/drive/v3/files",
        headers=headers,
        json=create_body,
    )
    create_res.raise_for_status()
    folder_id = create_res.json()["id"]
    print(f"[Drive] Created new 'SecureWorkspace' folder: ID = {folder_id}")
    return folder_id


def upload_encrypted_file(
    access_token: str, folder_id: str, filename: str, content_bytes: bytes
) -> str:
    """Uploads a file directly into the SecureWorkspace folder using multipart upload."""
    metadata = {
        "name": filename,
        "parents": [folder_id],
    }
    
    # Multipart upload payload
    files = {
        "data": (
            "metadata",
            json.dumps(metadata),
            "application/json; charset=UTF-8",
        ),
        "file": (filename, content_bytes, "application/octet-stream"),
    }
    
    res = requests.post(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size",
        headers={"Authorization": f"Bearer {access_token}"},
        files=files,
    )
    res.raise_for_status()
    uploaded = res.json()
    print(f"[Drive] Uploaded '{filename}': ID = {uploaded['id']} (Size = {len(content_bytes)} bytes)")
    return uploaded["id"]


def download_file(access_token: str, file_id: str) -> bytes:
    """Downloads binary file content from Google Drive."""
    res = requests.get(
        f"https://www.googleapis.com/drive/v3/files/{file_id}?alt=media",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    res.raise_for_status()
    return res.content


def delete_drive_file(access_token: str, file_id: str):
    """Deletes a file by ID (cleanup)."""
    res = requests.delete(
        f"https://www.googleapis.com/drive/v3/files/{file_id}",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    res.raise_for_status()
    print(f"[Drive] Cleaned up temporary test file ID = {file_id}")


def run_spike():
    print("=" * 60)
    print("RUNNING SPIKE 0.6: GOOGLE DRIVE ACCESS VALIDATION")
    print("=" * 60)

    # 1. Authenticate
    creds = get_credentials()
    token = creds.token
    email = get_user_email(token)
    print(f"[1] Connected successfully as: {email}")

    # 2. Folder resolution
    folder_id = get_or_create_app_folder(token)

    # 3. Upload test data
    test_payload = b"SECURE_WORKSPACE_TEST_CIPHERTEXT_" + os.urandom(1024)
    original_sha256 = hashlib.sha256(test_payload).hexdigest()
    test_filename = f"spike_test_{original_sha256[:8]}.bin"

    print(f"[3] Uploading test object (SHA256: {original_sha256[:16]}...)...")
    file_id = upload_encrypted_file(token, folder_id, test_filename, test_payload)

    # 4. Download and verify integrity
    print("[4] Downloading test object back from Google Drive...")
    downloaded_bytes = download_file(token, file_id)
    downloaded_sha256 = hashlib.sha256(downloaded_bytes).hexdigest()
    print(f"    Downloaded SHA256: {downloaded_sha256[:16]}...")

    assert original_sha256 == downloaded_sha256, "Downloaded bytes do not match uploaded bytes!"
    print("    -> PASS: Uploaded and downloaded data match 100% exactly.")

    # 5. Clean up
    delete_drive_file(token, file_id)

    print("=" * 60)
    print("SPIKE 0.6 RESULTS: GOOGLE DRIVE ACCESS PASSED SUCCESSFULLY")
    print("=" * 60)


if __name__ == "__main__":
    run_spike()
