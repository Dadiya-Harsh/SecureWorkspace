"""
Authentication module for SecureWorkspace.
Provides OAuth2 integrations for remote storage providers.
"""

from secureworkspace_core.auth.google_oauth import (
    GoogleOAuthManager,
    SCOPES,
    find_client_secret_file,
    get_default_credentials_path,
)

__all__ = [
    "GoogleOAuthManager",
    "SCOPES",
    "find_client_secret_file",
    "get_default_credentials_path",
]
