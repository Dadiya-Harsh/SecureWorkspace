"""
Spike 0.1: Desktop Crypto Validation Spike
Tests:
1. Password Key Derivation with Argon2id.
2. File encryption and decryption with libsodium SecretStream (XChaCha20-Poly1305) in chunks.
3. Integrity check: SHA-256 matches exactly after round trip.
4. Tamper check: altering a single byte in the ciphertext MUST cause decryption to fail safely.
"""

import hashlib
import os
import sys
import tempfile
import nacl.bindings as sodium
import nacl.pwhash.argon2id as argon2
import nacl.utils as utils
from nacl.exceptions import CryptoError

# SecretStream constants
CHUNK_SIZE = 64 * 1024  # 64 KB chunks
HEADER_BYTES = sodium.crypto_secretstream_xchacha20poly1305_HEADERBYTES
KEY_BYTES = sodium.crypto_secretstream_xchacha20poly1305_KEYBYTES
TAG_MESSAGE = sodium.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE
TAG_FINAL = sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL
SALT_BYTES = argon2.SALTBYTES


def derive_key(password: str, salt: bytes) -> bytes:
    """Derive a 32-byte symmetric key from a password using Argon2id."""
    return argon2.kdf(
        KEY_BYTES,
        password.encode("utf-8"),
        salt,
        opslimit=argon2.OPSLIMIT_INTERACTIVE,
        memlimit=argon2.MEMLIMIT_INTERACTIVE,
    )


def encrypt_file(input_path: str, output_path: str, key: bytes):
    """
    Encrypts a file in chunks using XChaCha20-Poly1305 SecretStream.
    Format on disk:
      [24-byte SecretStream header] + [Encrypted chunks with Poly1305 MACs]
    """
    state = sodium.crypto_secretstream_xchacha20poly1305_state()
    header = sodium.crypto_secretstream_xchacha20poly1305_init_push(state, key)

    file_size = os.path.getsize(input_path)

    with open(input_path, "rb") as fin, open(output_path, "wb") as fout:
        fout.write(header)
        bytes_read = 0

        while True:
            chunk = fin.read(CHUNK_SIZE)
            bytes_read += len(chunk)
            is_final = bytes_read >= file_size or len(chunk) == 0
            tag = TAG_FINAL if is_final else TAG_MESSAGE

            ciphertext_chunk = sodium.crypto_secretstream_xchacha20poly1305_push(
                state, chunk, b"", tag
            )
            # Prefix each chunk with a 4-byte big-endian length so the stream can be read cleanly
            fout.write(len(ciphertext_chunk).to_bytes(4, byteorder="big"))
            fout.write(ciphertext_chunk)

            if is_final:
                break


def decrypt_file(input_path: str, output_path: str, key: bytes):
    """
    Decrypts a SecretStream file chunk-by-chunk.
    Raises CryptoError if any chunk is modified, corrupted, or reordered.
    """
    state = sodium.crypto_secretstream_xchacha20poly1305_state()

    with open(input_path, "rb") as fin, open(output_path, "wb") as fout:
        header = fin.read(HEADER_BYTES)
        if len(header) < HEADER_BYTES:
            raise CryptoError("Ciphertext header is truncated or invalid.")

        sodium.crypto_secretstream_xchacha20poly1305_init_pull(state, header, key)

        while True:
            length_bytes = fin.read(4)
            if not length_bytes:
                break
            chunk_len = int.from_bytes(length_bytes, byteorder="big")
            chunk = fin.read(chunk_len)
            if len(chunk) != chunk_len:
                raise CryptoError("Unexpected end of chunk data.")

            message, tag = sodium.crypto_secretstream_xchacha20poly1305_pull(
                state, chunk, b""
            )
            fout.write(message)

            if tag == TAG_FINAL:
                break


def sha256_file(path: str) -> str:
    hasher = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


def run_spike():
    print("=" * 60)
    print("RUNNING SPIKE 0.1: CRYPTO VALIDATION ON DESKTOP")
    print("=" * 60)

    with tempfile.TemporaryDirectory() as tmpdir:
        original_file = os.path.join(tmpdir, "original_sample.bin")
        encrypted_file = os.path.join(tmpdir, "encrypted.sw")
        decrypted_file = os.path.join(tmpdir, "decrypted.bin")
        tampered_file = os.path.join(tmpdir, "tampered.sw")

        # 1. Generate a multi-chunk test file (300 KB to span ~5 chunks of 64 KB)
        sample_data = os.urandom(300 * 1024)
        with open(original_file, "wb") as f:
            f.write(sample_data)

        orig_hash = sha256_file(original_file)
        print(f"[1] Original test file created: 300 KB (SHA256: {orig_hash[:16]}...)")

        # 2. Key derivation
        password = "UserMasterPassword#2026!"
        salt = utils.random(SALT_BYTES)
        key = derive_key(password, salt)
        print(f"[2] Derived 256-bit encryption key with Argon2id: OK (Key len: {len(key)} bytes)")

        # 3. Encryption
        encrypt_file(original_file, encrypted_file, key)
        enc_size = os.path.getsize(encrypted_file)
        print(f"[3] File encrypted with XChaCha20-Poly1305 SecretStream: OK (Ciphertext size: {enc_size} bytes)")

        # 4. Decryption
        decrypt_file(encrypted_file, decrypted_file, key)
        dec_hash = sha256_file(decrypted_file)
        print(f"[4] File decrypted: OK (SHA256: {dec_hash[:16]}...)")

        # Verify round-trip match
        assert orig_hash == dec_hash, "Decrypted file hash does not match original!"
        print("    -> PASS: Plaintext matches decrypted data 100% exactly.")

        # 5. Wrong Password / Wrong Key Test
        wrong_key = derive_key("WrongPassword#999", salt)
        wrong_decrypted = os.path.join(tmpdir, "wrong_dec.bin")
        try:
            decrypt_file(encrypted_file, wrong_decrypted, wrong_key)
            print("    -> FAIL: Decryption with wrong password should have thrown an error!")
            sys.exit(1)
        except CryptoError:
            print("[5] Decryption with WRONG password rejected: OK (CryptoError raised safely)")

        # 6. Tamper Resistance Test
        # Read the ciphertext, flip one byte in the middle of a chunk, write to tampered_file
        with open(encrypted_file, "rb") as fin:
            ct = bytearray(fin.read())

        # Flip a bit around byte 1000 (inside ciphertext payload)
        ct[1000] ^= 0xFF
        with open(tampered_file, "wb") as fout:
            fout.write(ct)

        tampered_output = os.path.join(tmpdir, "tampered_out.bin")
        try:
            decrypt_file(tampered_file, tampered_output, key)
            print("    -> FAIL: Tampered ciphertext was decrypted without error!")
            sys.exit(1)
        except CryptoError:
            print("[6] Tampered ciphertext byte rejected: OK (CryptoError raised safely)")

    print("=" * 60)
    print("SPIKE 0.1 RESULTS: ALL CHECKS PASSED SUCCESSFULLY")
    print("=" * 60)


if __name__ == "__main__":
    run_spike()
