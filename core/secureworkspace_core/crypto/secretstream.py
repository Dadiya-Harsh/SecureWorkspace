"""
Streaming chunked encryption and decryption using libsodium SecretStream (XChaCha20-Poly1305).
Provides bounded-memory chunk streaming with integrity and truncation protection.
"""

import io
from typing import BinaryIO
import nacl.bindings as sodium
from nacl.exceptions import CryptoError

from secureworkspace_core.constants import (
    CHUNK_SIZE,
    FILE_MAGIC,
    FORMAT_VERSION,
    HEADER_BYTES,
    KEY_BYTES,
)


class SecretStreamEncryptor:
    """
    Encrypts a file-like input stream to an output stream in chunks.
    Format written:
      [Magic 4B: SWF1] [Version 2B: 0x0001] [Header 24B]
      Repeated:
        [Chunk Length 4B uint32 BE] [Ciphertext Chunk (Plaintext + 17B Poly1305 tag)]
    """

    def __init__(self, key: bytes, chunk_size: int = CHUNK_SIZE):
        if len(key) != KEY_BYTES:
            raise ValueError(f"Key must be {KEY_BYTES} bytes, got {len(key)}")
        self.key = key
        self.chunk_size = chunk_size

    def encrypt(self, source: BinaryIO, destination: BinaryIO) -> int:
        """
        Encrypts source stream into destination stream.
        Returns total bytes written to destination.
        """
        # Write file envelope magic and version
        destination.write(FILE_MAGIC)
        destination.write(FORMAT_VERSION.to_bytes(2, "big"))

        state = sodium.crypto_secretstream_xchacha20poly1305_state()
        header = sodium.crypto_secretstream_xchacha20poly1305_init_push(state, self.key)
        destination.write(header)

        bytes_written = len(FILE_MAGIC) + 2 + len(header)

        while True:
            chunk = source.read(self.chunk_size)
            # Peek 1 byte to check if this is the final chunk
            peek = source.read(1)
            if peek:
                # Not final yet; put the peeked byte back into our buffer
                chunk = chunk + peek
                tag = sodium.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE
            else:
                # No more data; this is the final chunk
                tag = sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL

            ciphertext_chunk = sodium.crypto_secretstream_xchacha20poly1305_push(
                state, chunk, b"", tag
            )

            chunk_len = len(ciphertext_chunk)
            destination.write(chunk_len.to_bytes(4, "big"))
            destination.write(ciphertext_chunk)
            bytes_written += 4 + chunk_len

            if tag == sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL:
                break

        return bytes_written


class SecretStreamDecryptor:
    """
    Decrypts a SecretStream file envelope chunk-by-chunk.
    Verifies magic bytes, version, and enforces that the stream ends with TAG_FINAL.
    """

    def __init__(self, key: bytes):
        if len(key) != KEY_BYTES:
            raise ValueError(f"Key must be {KEY_BYTES} bytes, got {len(key)}")
        self.key = key

    def decrypt(self, source: BinaryIO, destination: BinaryIO) -> int:
        """
        Decrypts source stream into destination stream.
        Returns total bytes of decrypted plaintext written to destination.
        Raises CryptoError if ciphertext is truncated, corrupted, or tampered with.
        """
        # 1. Read and verify Magic (4B)
        magic = source.read(4)
        if magic != FILE_MAGIC:
            raise CryptoError(f"Invalid file magic: expected {FILE_MAGIC!r}, got {magic!r}")

        # 2. Read and verify Version (2B)
        version_bytes = source.read(2)
        if len(version_bytes) < 2:
            raise CryptoError("File truncated before version header.")
        version = int.from_bytes(version_bytes, "big")
        if version != FORMAT_VERSION:
            raise CryptoError(f"Unsupported file format version: {version}")

        # 3. Read SecretStream Header (24B)
        header = source.read(HEADER_BYTES)
        if len(header) < HEADER_BYTES:
            raise CryptoError("File truncated before SecretStream header.")

        state = sodium.crypto_secretstream_xchacha20poly1305_state()
        sodium.crypto_secretstream_xchacha20poly1305_init_pull(state, header, self.key)

        bytes_written = 0
        final_seen = False

        while True:
            length_bytes = source.read(4)
            if not length_bytes:
                break  # EOF

            chunk_len = int.from_bytes(length_bytes, "big")
            chunk = source.read(chunk_len)
            if len(chunk) != chunk_len:
                raise CryptoError("Truncated ciphertext chunk: unexpected end of stream.")

            plaintext_chunk, tag = sodium.crypto_secretstream_xchacha20poly1305_pull(
                state, chunk, b""
            )
            destination.write(plaintext_chunk)
            bytes_written += len(plaintext_chunk)

            if tag == sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL:
                final_seen = True
                break

        if not final_seen:
            raise CryptoError("Incomplete stream: file was truncated before TAG_FINAL was reached.")

        return bytes_written
