"""
Google OAuth 2.0 Integration for SecureWorkspace.
Implements the desktop authorization flow using InstalledAppFlow with drive.file scope,
silent token auto-refresh, and persistent credential storage.
"""

import logging
import os
from pathlib import Path
from typing import Any, Callable, Dict, Optional
import platformdirs
import requests
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow

from secureworkspace_core.storage.adapter import AuthenticationError
from secureworkspace_core.storage.drive import GoogleDriveStorageAdapter

logger = logging.getLogger("secureworkspace.auth.google")

# Allow OAuth scope expansion (Google adds 'openid' when userinfo is requested)
os.environ["OAUTHLIB_RELAX_TOKEN_SCOPE"] = "1"

SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/userinfo.email",
]

USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v2/userinfo"


def get_default_credentials_path() -> Path:
    """Returns the persistent path for storing OAuth credentials."""
    app_data = platformdirs.user_data_dir("SecureWorkspace", appauthor=False)
    return Path(app_data) / "credentials.json"


def find_client_secret_file(custom_path: Optional[str] = None) -> Optional[Path]:
    """
    Discovers the Google OAuth client secret JSON file across standard project and system locations.
    """
    if custom_path:
        p = Path(custom_path).expanduser().resolve()
        if p.is_file():
            return p

    env_path = os.environ.get("SECUREWORKSPACE_CLIENT_SECRET_FILE")
    if env_path:
        p = Path(env_path).expanduser().resolve()
        if p.is_file():
            return p

    # Candidate directories relative to this file up to repository root
    current = Path(__file__).resolve().parent
    for _ in range(5):
        client_dir = current / "google outh clients"
        if client_dir.is_dir():
            for f in client_dir.glob("client_secret*.json"):
                if f.is_file():
                    return f
        current = current.parent

    # Candidate directories relative to current working directory
    cwd = Path.cwd().resolve()
    for _ in range(3):
        client_dir = cwd / "google outh clients"
        if client_dir.is_dir():
            for f in client_dir.glob("client_secret*.json"):
                if f.is_file():
                    return f
        cwd = cwd.parent

    # System application data dir
    app_data = Path(platformdirs.user_data_dir("SecureWorkspace", appauthor=False))
    if (app_data / "client_secret_desktop.json").is_file():
        return app_data / "client_secret_desktop.json"

    # User home fallback
    home_candidate = Path.home() / ".secureworkspace" / "client_secret_desktop.json"
    if home_candidate.is_file():
        return home_candidate

    return None


class GoogleOAuthManager:
    """
    Manages OAuth2 lifecycle for Google Drive:
    - Initiates desktop browser OAuth consent flow
    - Refreshes tokens automatically
    - Caches authorized credentials on disk
    - Generates token providers and Drive storage adapters
    """

    def __init__(
        self,
        client_secret_path: Optional[str] = None,
        credentials_path: Optional[str] = None,
    ):
        self.client_secret_path = (
            Path(client_secret_path).resolve()
            if client_secret_path
            else find_client_secret_file()
        )
        self.credentials_path = (
            Path(credentials_path).resolve()
            if credentials_path
            else get_default_credentials_path()
        )
        self._cached_creds: Optional[Credentials] = None

    def _find_dev_fallback_token(self) -> Optional[Path]:
        """Looks for Spike 0.6 token.json if default credentials do not exist yet."""
        current = Path(__file__).resolve().parent
        for _ in range(5):
            candidate = current / "spikes" / "spike_06_drive" / "token.json"
            if candidate.is_file():
                return candidate
            current = current.parent
        return None

    def is_authenticated(self) -> bool:
        """Checks if valid credentials exist or can be refreshed."""
        try:
            creds = self.get_credentials()
            return creds is not None and (creds.valid or bool(creds.refresh_token))
        except Exception:
            return False

    def get_credentials(self) -> Optional[Credentials]:
        """
        Retrieves user credentials from disk, performing silent refresh if expired.
        Saves updated tokens back to disk when refreshed.
        """
        if self._cached_creds is not None and self._cached_creds.valid:
            return self._cached_creds

        target_file = self.credentials_path
        if not target_file.is_file():
            fallback = self._find_dev_fallback_token()
            if fallback and fallback.is_file():
                target_file = fallback

        if not target_file.is_file():
            return None

        try:
            creds = Credentials.from_authorized_user_file(str(target_file), SCOPES)
        except Exception as e:
            logger.warning(f"Failed to parse credentials from {target_file}: {e}")
            return None

        if not creds.valid:
            if creds.expired and creds.refresh_token:
                try:
                    logger.info("Access token expired. Refreshing silently...")
                    creds.refresh(Request())
                    self._save_credentials(creds)
                except Exception as e:
                    logger.error(f"Failed to refresh credentials: {e}")
                    return None
            else:
                return None

        self._cached_creds = creds
        return creds

    def _save_credentials(self, creds: Credentials) -> None:
        """Persists credentials JSON to the user's secure application directory."""
        self.credentials_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.credentials_path, "w", encoding="utf-8") as f:
            f.write(creds.to_json())
        self._cached_creds = creds
        logger.info(f"Saved OAuth credentials to {self.credentials_path}")

    def get_access_token(self) -> str:
        """
        Returns a valid access token.
        Raises AuthenticationError if no credentials exist or refresh fails.
        """
        creds = self.get_credentials()
        if not creds or not creds.token:
            raise AuthenticationError(
                "Google Drive authentication required. Please authorize your Google account."
            )
        return creds.token

    def get_token_provider(self) -> Callable[[], str]:
        """Returns a Callable[[], str] token provider for GoogleDriveStorageAdapter."""
        return self.get_access_token

    def get_user_info(self, access_token: Optional[str] = None) -> Dict[str, Any]:
        """
        Fetches user info (email, verified_email, picture) from Google's userinfo endpoint.
        """
        token = access_token or self.get_access_token()
        res = requests.get(
            USERINFO_ENDPOINT,
            headers={"Authorization": f"Bearer {token}"},
            timeout=10,
        )
        res.raise_for_status()
        return res.json()

    def login(
        self,
        port: int = 0,
        open_browser: bool = True,
        success_message: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Initiates Google OAuth local server flow in the desktop browser.
        Returns user information and tokens upon authorization.
        """
        secret_file = self.client_secret_path or find_client_secret_file()
        if not secret_file or not secret_file.is_file():
            raise FileNotFoundError(
                "Google OAuth client secrets file not found. "
                "Please ensure client_secret_desktop.json exists in 'google outh clients'."
            )

        msg = (
            success_message
            or "Authentication successful! You may now return to SecureWorkspace."
        )

        flow = InstalledAppFlow.from_client_secrets_file(str(secret_file), SCOPES)
        creds = flow.run_local_server(
            port=port,
            prompt="consent",
            open_browser=open_browser,
            success_message=msg,
        )

        self._save_credentials(creds)
        user_info = self.get_user_info(creds.token)

        return {
            "email": user_info.get("email", "Unknown"),
            "name": user_info.get("name", ""),
            "picture": user_info.get("picture", ""),
            "access_token": creds.token,
        }

    def logout(self) -> bool:
        """Removes local credentials and invalidates active session token."""
        self._cached_creds = None
        if self.credentials_path.is_file():
            try:
                self.credentials_path.unlink()
                return True
            except OSError as e:
                logger.warning(f"Error removing credentials file {self.credentials_path}: {e}")
                return False
        return True

    def create_storage_adapter(
        self, app_folder_name: str = "SecureWorkspace"
    ) -> GoogleDriveStorageAdapter:
        """Constructs an authenticated GoogleDriveStorageAdapter."""
        return GoogleDriveStorageAdapter(
            token_provider=self.get_token_provider(),
            app_folder_name=app_folder_name,
        )
