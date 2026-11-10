"""
Integration tests for GoogleDriveStorageAdapter against real Google Drive.
Runs if token.json is present from Spike 0.6; otherwise skipped.
"""

import hashlib
import os
import tempfile
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
import pytest

from secureworkspace_core.storage.drive import GoogleDriveStorageAdapter

TOKEN_FILE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "spikes",
    "spike_06_drive",
    "token.json",
)


def get_live_token_provider():
    if not os.path.exists(TOKEN_FILE):
        return None

    def token_provider() -> str:
        creds = Credentials.from_authorized_user_file(TOKEN_FILE)
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            with open(TOKEN_FILE, "w") as f:
                f.write(creds.to_json())
        return creds.token

    return token_provider


@pytest.mark.skipif(
    not os.path.exists(TOKEN_FILE),
    reason="Integration test requires token.json from Spike 0.6",
)
def test_live_google_drive_storage_adapter():
    token_provider = get_live_token_provider()
    adapter = GoogleDriveStorageAdapter(token_provider=token_provider)

    # 1. Ensure app folder
    folder_id = adapter.ensure_app_folder()
    assert folder_id is not None
    assert len(folder_id) > 5

    # 2. Upload test bytes
    test_data = b"INTEGRATION_TEST_PAYLOAD_" + os.urandom(1024)
    expected_hash = hashlib.sha256(test_data).hexdigest()
    remote_name = f"int_test_{expected_hash[:8]}.bin"

    remote_file = adapter.upload_bytes(test_data, remote_name)
    assert remote_file.id is not None
    assert remote_file.name == remote_name

    try:
        # 3. Download bytes & verify
        downloaded = adapter.download_bytes(remote_file.id)
        assert hashlib.sha256(downloaded).hexdigest() == expected_hash

        # 4. Get metadata
        meta = adapter.get_metadata(remote_file.id)
        assert meta.id == remote_file.id
        assert meta.name == remote_name

        # 5. List files
        files = adapter.list_files()
        assert any(f.id == remote_file.id for f in files)

    finally:
        # 6. Cleanup
        adapter.delete_file(remote_file.id)
