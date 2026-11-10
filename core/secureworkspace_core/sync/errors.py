"""
Custom exceptions for SecureWorkspace sync engine (Pull, Push, Revert).
"""


class SyncError(Exception):
    """Base exception for all synchronization errors."""
    pass


class DriveAheadError(SyncError):
    """Raised when remote Drive has newer versions than local base version."""
    pass


class ConcurrentPushError(SyncError):
    """Raised when remote HEAD changes concurrently during a push operation."""
    pass


class MassDeletionGuardError(SyncError):
    """Raised when a push would delete a significant portion of files without confirmation."""
    pass


class DivergedWorkspaceError(SyncError):
    """Raised when both local unpushed changes exist and remote Drive has newer versions."""
    pass


class ManifestNotFoundError(SyncError):
    """Raised when a requested remote version manifest does not exist."""
    pass
