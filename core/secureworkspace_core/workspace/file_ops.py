"""
High-level file operations for encrypting, decrypting, and verifying files.
"""

from dataclasses import dataclass
import hashlib
import os
import uuid
from secureworkspace_core.crypto.keys import derive_file_key
from secureworkspace_core.crypto.secretstream import (
    SecretStreamDecryptor,
    SecretStreamEncryptor,
)


@dataclass
class EncryptedFileMetadata:
    file_id: bytes         # 16-byte UUID
    plaintext_size: int
    ciphertext_size: int
    plaintext_sha256: str


class HashingReader:
    """Wrapper around a binary file reader that computes SHA-256 on the fly."""

    def __init__(self, stream):
        self.stream = stream
        self.hasher = hashlib.sha256()
        self.bytes_read = 0

    def read(self, size=-1) -> bytes:
        chunk = self.stream.read(size)
        if chunk:
            self.hasher.update(chunk)
            self.bytes_read += len(chunk)
        return chunk

    @property
    def hexdigest(self) -> str:
        return self.hasher.hexdigest()


class HashingWriter:
    """Wrapper around a binary file writer that computes SHA-256 on the fly."""

    def __init__(self, stream):
        self.stream = stream
        self.hasher = hashlib.sha256()
        self.bytes_written = 0

    def write(self, data: bytes) -> int:
        self.hasher.update(data)
        self.bytes_written += len(data)
        return self.stream.write(data)

    @property
    def hexdigest(self) -> str:
        return self.hasher.hexdigest()


def encrypt_file(
    input_path: str,
    output_path: str,
    wmk: bytes,
    file_id: bytes | None = None,
) -> EncryptedFileMetadata:
    """
    Encrypts a file on disk into a chunked SecretStream envelope.
    Derives per-file key from WMK and file_id.
    Returns EncryptedFileMetadata.
    """
    if file_id is None:
        file_id = uuid.uuid4().bytes

    file_key = derive_file_key(wmk, file_id)
    encryptor = SecretStreamEncryptor(file_key)

    with open(input_path, "rb") as fin, open(output_path, "wb") as fout:
        hashing_in = HashingReader(fin)
        cipher_bytes = encryptor.encrypt(hashing_in, fout)

    return EncryptedFileMetadata(
        file_id=file_id,
        plaintext_size=hashing_in.bytes_read,
        ciphertext_size=cipher_bytes,
        plaintext_sha256=hashing_in.hexdigest,
    )


def decrypt_file(
    input_path: str,
    output_path: str,
    wmk: bytes,
    file_id: bytes,
) -> str:
    """
    Decrypts an encrypted file from disk.
    Returns the SHA-256 hex string of the decrypted plaintext.
    """
    file_key = derive_file_key(wmk, file_id)
    decryptor = SecretStreamDecryptor(file_key)

    with open(input_path, "rb") as fin, open(output_path, "wb") as fout:
        hashing_out = HashingWriter(fout)
        decryptor.decrypt(fin, hashing_out)

    return hashing_out.hexdigest
