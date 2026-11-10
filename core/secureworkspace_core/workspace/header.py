"""
Workspace Header serialization, parsing, and unlocking logic.
Every SecureWorkspace has a single header file containing key wrapping data.
"""

from dataclasses import dataclass
import struct
import time
import uuid
import nacl.utils
from nacl.exceptions import CryptoError

from secureworkspace_core.constants import (
    FORMAT_VERSION,
    WORKSPACE_HEADER_MAGIC,
)
from secureworkspace_core.crypto.kdf import (
    DEFAULT_MEMLIMIT,
    DEFAULT_OPSLIMIT,
    derive_kek_from_password,
    derive_kek_from_recovery_entropy,
)
from secureworkspace_core.crypto.keys import (
    generate_wmk,
    unwrap_wmk,
    wrap_wmk,
)
from secureworkspace_core.crypto.recovery import (
    generate_recovery_phrase,
    phrase_to_entropy,
)

HEADER_STRUCT_FORMAT = ">4sH16sII16s16s24s48s24s48sq32s"
EXPECTED_HEADER_SIZE = struct.calcsize(HEADER_STRUCT_FORMAT)  # exactly 246 bytes


@dataclass
class WorkspaceHeader:
    workspace_id: bytes         # 16 bytes UUID
    name: str                   # Human-readable workspace name (up to 32 chars)
    opslimit: int               # Argon2id opslimit
    memlimit: int               # Argon2id memlimit
    password_salt: bytes        # 16 bytes
    recovery_salt: bytes        # 16 bytes
    password_nonce: bytes       # 24 bytes
    wrapped_wmk_password: bytes # 48 bytes
    recovery_nonce: bytes       # 24 bytes
    wrapped_wmk_recovery: bytes # 48 bytes
    created_at_ms: int          # Epoch milliseconds

    def to_bytes(self) -> bytes:
        """Serializes the header into fixed 246-byte binary format."""
        encoded_name = self.name.encode("utf-8")[:32].ljust(32, b"\x00")
        return struct.pack(
            HEADER_STRUCT_FORMAT,
            WORKSPACE_HEADER_MAGIC,
            FORMAT_VERSION,
            self.workspace_id,
            self.opslimit,
            self.memlimit,
            self.password_salt,
            self.recovery_salt,
            self.password_nonce,
            self.wrapped_wmk_password,
            self.recovery_nonce,
            self.wrapped_wmk_recovery,
            self.created_at_ms,
            encoded_name,
        )

    @classmethod
    def from_bytes(cls, data: bytes) -> "WorkspaceHeader":
        """Parses and validates a 246-byte binary workspace header."""
        if len(data) != EXPECTED_HEADER_SIZE:
            raise ValueError(
                f"Invalid header size: expected {EXPECTED_HEADER_SIZE} bytes, got {len(data)}"
            )

        (
            magic,
            version,
            ws_id,
            opslimit,
            memlimit,
            pwd_salt,
            rec_salt,
            pwd_nonce,
            wrapped_pwd,
            rec_nonce,
            wrapped_rec,
            created_at,
            raw_name,
        ) = struct.unpack(HEADER_STRUCT_FORMAT, data)

        if magic != WORKSPACE_HEADER_MAGIC:
            raise ValueError(f"Invalid workspace header magic: {magic!r}")
        if version != FORMAT_VERSION:
            raise ValueError(f"Unsupported workspace header version: {version}")

        name = raw_name.rstrip(b"\x00").decode("utf-8", errors="replace")

        return cls(
            workspace_id=ws_id,
            name=name,
            opslimit=opslimit,
            memlimit=memlimit,
            password_salt=pwd_salt,
            recovery_salt=rec_salt,
            password_nonce=pwd_nonce,
            wrapped_wmk_password=wrapped_pwd,
            recovery_nonce=rec_nonce,
            wrapped_wmk_recovery=wrapped_rec,
            created_at_ms=created_at,
        )

    @classmethod
    def create(
        cls,
        name: str,
        password: str,
        recovery_phrase: str | None = None,
    ) -> tuple["WorkspaceHeader", str, bytes]:
        """
        Creates a new WorkspaceHeader, generating a fresh WMK and recovery phrase.
        Returns: (header, recovery_phrase, wmk)
        """
        if not recovery_phrase:
            recovery_phrase = generate_recovery_phrase()

        rec_entropy = phrase_to_entropy(recovery_phrase)
        wmk = generate_wmk()

        pwd_salt = nacl.utils.random(16)
        rec_salt = nacl.utils.random(16)

        opslimit = DEFAULT_OPSLIMIT
        memlimit = DEFAULT_MEMLIMIT

        # Derive KEKs
        pwd_kek = derive_kek_from_password(password, pwd_salt, opslimit=opslimit, memlimit=memlimit)
        rec_kek = derive_kek_from_recovery_entropy(rec_entropy, rec_salt, opslimit=opslimit, memlimit=memlimit)

        # Wrap WMK
        pwd_nonce, wrapped_pwd = wrap_wmk(wmk, pwd_kek)
        rec_nonce, wrapped_rec = wrap_wmk(wmk, rec_kek)

        ws_id = uuid.uuid4().bytes
        now_ms = int(time.time() * 1000)

        header = cls(
            workspace_id=ws_id,
            name=name,
            opslimit=opslimit,
            memlimit=memlimit,
            password_salt=pwd_salt,
            recovery_salt=rec_salt,
            password_nonce=pwd_nonce,
            wrapped_wmk_password=wrapped_pwd,
            recovery_nonce=rec_nonce,
            wrapped_wmk_recovery=wrapped_rec,
            created_at_ms=now_ms,
        )

        return header, recovery_phrase, wmk

    def unlock_with_password(self, password: str) -> bytes:
        """
        Unlocks the workspace using the master password.
        Returns the 32-byte Workspace Master Key (WMK).
        Raises CryptoError on incorrect password.
        """
        kek = derive_kek_from_password(
            password,
            self.password_salt,
            opslimit=self.opslimit,
            memlimit=self.memlimit,
        )
        return unwrap_wmk(self.wrapped_wmk_password, self.password_nonce, kek)

    def unlock_with_recovery_key(self, recovery_phrase: str) -> bytes:
        """
        Unlocks the workspace using the 24-word recovery phrase.
        Returns the 32-byte Workspace Master Key (WMK).
        Raises CryptoError on incorrect recovery key.
        """
        entropy = phrase_to_entropy(recovery_phrase)
        kek = derive_kek_from_recovery_entropy(
            entropy,
            self.recovery_salt,
            opslimit=self.opslimit,
            memlimit=self.memlimit,
        )
        return unwrap_wmk(self.wrapped_wmk_recovery, self.recovery_nonce, kek)
