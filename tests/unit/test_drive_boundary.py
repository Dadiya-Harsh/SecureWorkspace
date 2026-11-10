"""
Unit tests for GoogleDriveStorageAdapter folder boundary security.
"""

from unittest.mock import MagicMock
import pytest
import requests

from secureworkspace_core.storage.adapter import (
    FileNotFoundOnStorageError,
    FolderBoundaryViolationError,
)
from secureworkspace_core.storage.drive import GoogleDriveStorageAdapter


def test_drive_adapter_boundary_enforcement():
    # Mock requests session
    mock_session = MagicMock(spec=requests.Session)

    adapter = GoogleDriveStorageAdapter(
        token_provider=lambda: "mock_test_token",
        app_folder_id="trusted_secureworkspace_id",
        session=mock_session,
    )

    # 1. Simulate file response with parents NOT containing trusted_secureworkspace_id
    mock_resp = MagicMock(spec=requests.Response)
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "id": "unauthorized_file_123",
        "name": "personal_bank_statement.pdf",
        "size": "5000",
        "parents": ["some_alien_folder_xyz"],
        "modifiedTime": "2026-11-10T12:00:00Z",
    }
    mock_session.request.return_value = mock_resp

    with pytest.raises(FolderBoundaryViolationError, match="outside the SecureWorkspace folder"):
        adapter.verify_file_in_app_folder("unauthorized_file_123")


def test_drive_adapter_allows_valid_file_in_app_folder():
    mock_session = MagicMock(spec=requests.Session)

    adapter = GoogleDriveStorageAdapter(
        token_provider=lambda: "mock_test_token",
        app_folder_id="trusted_secureworkspace_id",
        session=mock_session,
    )

    # Simulate valid file with parent inside trusted_secureworkspace_id
    mock_resp = MagicMock(spec=requests.Response)
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "id": "valid_file_999",
        "name": "encrypted_blob.sw",
        "size": "65536",
        "parents": ["trusted_secureworkspace_id"],
        "modifiedTime": "2026-11-10T12:00:00Z",
        "appProperties": {"app": "SecureWorkspace"},
    }
    mock_session.request.return_value = mock_resp

    meta = adapter.verify_file_in_app_folder("valid_file_999")
    assert meta.id == "valid_file_999"
    assert meta.name == "encrypted_blob.sw"
    assert meta.parent_id == "trusted_secureworkspace_id"


def test_drive_adapter_file_not_found():
    mock_session = MagicMock(spec=requests.Session)

    adapter = GoogleDriveStorageAdapter(
        token_provider=lambda: "mock_test_token",
        app_folder_id="trusted_secureworkspace_id",
        session=mock_session,
    )

    mock_resp = MagicMock(spec=requests.Response)
    mock_resp.status_code = 404
    mock_session.request.return_value = mock_resp

    with pytest.raises(FileNotFoundOnStorageError):
        adapter.verify_file_in_app_folder("missing_file")
