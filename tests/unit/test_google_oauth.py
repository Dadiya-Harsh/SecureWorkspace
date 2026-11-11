"""
Unit tests for Google OAuth integration and API endpoints.
Validates credential caching, token refresh callbacks, discovery,
and SecureWorkspaceAPI / dispatch IPC integration.
"""

import json
from pathlib import Path
from unittest.mock import MagicMock, patch
import pytest

from secureworkspace_core.api import APIErrorCode, SecureWorkspaceAPI
from secureworkspace_core.auth.google_oauth import (
    GoogleOAuthManager,
    SCOPES,
    find_client_secret_file,
    get_default_credentials_path,
)
from secureworkspace_core.storage.adapter import AuthenticationError
from secureworkspace_core.storage.drive import GoogleDriveStorageAdapter


class MockCredentials:
    """Mock Google Credentials object for deterministic testing."""

    def __init__(
        self,
        token: str = "ya29.mock_token_12345",
        refresh_token: str = "1//mock_refresh_67890",
        valid: bool = True,
        expired: bool = False,
    ):
        self.token = token
        self.refresh_token = refresh_token
        self.valid = valid
        self.expired = expired
        self.refresh_called = False

    def refresh(self, request):
        self.refresh_called = True
        self.valid = True
        self.expired = False
        self.token = "ya29.mock_token_refreshed_99999"

    def to_json(self) -> str:
        return json.dumps(
            {
                "token": self.token,
                "refresh_token": self.refresh_token,
                "token_uri": "https://oauth2.googleapis.com/token",
                "client_id": "mock_client_id.apps.googleusercontent.com",
                "client_secret": "mock_client_secret",
                "scopes": SCOPES,
                "universe_domain": "googleapis.com",
                "account": "",
                "expiry": "2030-01-01T00:00:00Z",
            }
        )


def test_find_client_secret_file(tmp_path: Path):
    # Custom existing file
    dummy_secret = tmp_path / "dummy_secret.json"
    dummy_secret.write_text("{}", encoding="utf-8")
    assert find_client_secret_file(str(dummy_secret)) == dummy_secret.resolve()

    # Non-existent custom path
    missing_path = tmp_path / "does_not_exist.json"
    assert find_client_secret_file(str(missing_path)) != missing_path


def test_oauth_unauthenticated_state(tmp_path: Path):
    creds_file = tmp_path / "empty_creds" / "credentials.json"
    manager = GoogleOAuthManager(credentials_path=str(creds_file))

    # Disable fallback to spike token during unit test
    with patch.object(manager, "_find_dev_fallback_token", return_value=None):
        assert not manager.is_authenticated()
        assert manager.get_credentials() is None
        with pytest.raises(AuthenticationError):
            manager.get_access_token()


def test_oauth_authenticated_and_refresh_flow(tmp_path: Path):
    creds_file = tmp_path / "creds" / "credentials.json"
    manager = GoogleOAuthManager(credentials_path=str(creds_file))

    # 1. Save valid credentials
    mock_creds = MockCredentials(valid=True, expired=False)
    manager._save_credentials(mock_creds)
    assert creds_file.is_file()
    assert manager.is_authenticated()
    assert manager.get_access_token() == "ya29.mock_token_12345"

    # 2. Simulate expired token with valid refresh token
    expired_creds = MockCredentials(
        token="ya29.old_expired_token",
        refresh_token="1//valid_refresh",
        valid=False,
        expired=True,
    )
    with patch(
        "secureworkspace_core.auth.google_oauth.Credentials.from_authorized_user_file",
        return_value=expired_creds,
    ):
        manager._cached_creds = None
        refreshed_token = manager.get_access_token()
        assert refreshed_token == "ya29.mock_token_refreshed_99999"
        assert expired_creds.refresh_called is True

    # 3. Create drive adapter
    adapter = manager.create_storage_adapter()
    assert isinstance(adapter, GoogleDriveStorageAdapter)
    assert adapter.token_provider() == "ya29.mock_token_refreshed_99999"

    # 4. Logout
    assert manager.logout() is True
    assert not creds_file.is_file()
    with patch.object(manager, "_find_dev_fallback_token", return_value=None):
        assert not manager.is_authenticated()


def test_api_google_auth_integration(tmp_path: Path):
    creds_file = tmp_path / "api_creds" / "credentials.json"
    manager = GoogleOAuthManager(credentials_path=str(creds_file))
    api = SecureWorkspaceAPI(oauth_manager=manager)

    # 1. Status when unauthenticated
    with patch.object(manager, "_find_dev_fallback_token", return_value=None):
        status_unauth = api.google_auth_status()
        assert status_unauth["success"]
        assert status_unauth["data"]["authenticated"] is False
        assert status_unauth["data"]["storage_connected"] is False

    # 2. Mock successful login flow
    mock_flow = MagicMock()
    mock_flow.run_local_server.return_value = MockCredentials()
    user_info_resp = {
        "email": "testuser@example.com",
        "name": "Test User",
        "picture": "https://example.com/avatar.png",
    }

    dummy_secret = tmp_path / "client_secret.json"
    dummy_secret.write_text("{}", encoding="utf-8")
    manager.client_secret_path = dummy_secret

    with patch(
        "secureworkspace_core.auth.google_oauth.InstalledAppFlow.from_client_secrets_file",
        return_value=mock_flow,
    ), patch.object(manager, "get_user_info", return_value=user_info_resp):
        login_res = api.google_auth_login(port=0)
        assert login_res["success"]
        assert login_res["data"]["authenticated"] is True
        assert login_res["data"]["email"] == "testuser@example.com"
        assert login_res["data"]["storage_connected"] is True
        assert api._storage is not None

        # Status check now reports authenticated & connected
        status_auth = api.google_auth_status()
        assert status_auth["success"]
        assert status_auth["data"]["authenticated"] is True
        assert status_auth["data"]["email"] == "testuser@example.com"
        assert status_auth["data"]["storage_connected"] is True

        # Dispatch IPC check
        dispatch_res = json.loads(api.dispatch("google_auth_status"))
        assert dispatch_res["success"]
        assert dispatch_res["data"]["authenticated"] is True

        # Logout
        logout_res = api.google_auth_logout()
        assert logout_res["success"]
        assert api._storage is None
        with patch.object(manager, "_find_dev_fallback_token", return_value=None):
            assert api.google_auth_status()["data"]["authenticated"] is False
