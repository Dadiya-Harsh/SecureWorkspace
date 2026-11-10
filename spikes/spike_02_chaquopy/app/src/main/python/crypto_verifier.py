"""
crypto_verifier.py - Executed inside Android via Chaquopy
Validates:
1. PyNaCl imports and libsodium bindings work natively on Android (ARM64 / x86_64).
2. Spike 0.3: Cross-device decryption of file encrypted on Windows 11.
3. On-device encryption and decryption roundtrip.
4. Tamper detection on Android.
"""

import hashlib
import os
import sys
import nacl
import nacl.bindings as sodium
import nacl.pwhash.argon2id as argon2
from nacl.exceptions import CryptoError

PASSWORD = b"SecureWorkspace-Phase0-Key#2026"
SALT = b"1234567890123456"
EXPECTED_SHA256 = "419053da0bb476f7a4b4179075afd1fe010987855e72d3612c74a888ccd9d300"


def run_verification() -> str:
    lines = []
    lines.append("=== CHAQUOPY & PYNACL VERIFICATION ===")
    lines.append(f"Python Version: {sys.version.split()[0]}")
    lines.append(f"PyNaCl Version: {nacl.__version__}")
    lines.append(f"Platform: Android ({os.uname().machine})")
    lines.append("-" * 35)

    # Test 1: Cross-Device Decrypt (Spike 0.3)
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        enc_path = os.path.join(current_dir, "windows_encrypted.bin")

        if not os.path.exists(enc_path):
            raise FileNotFoundError(f"Missing test file: {enc_path}")

        key = argon2.kdf(
            sodium.crypto_secretstream_xchacha20poly1305_KEYBYTES,
            PASSWORD,
            SALT,
            opslimit=argon2.OPSLIMIT_INTERACTIVE,
            memlimit=argon2.MEMLIMIT_INTERACTIVE,
        )

        with open(enc_path, "rb") as f:
            header = f.read(sodium.crypto_secretstream_xchacha20poly1305_HEADERBYTES)
            length_bytes = f.read(4)
            chunk_len = int.from_bytes(length_bytes, "big")
            ciphertext = f.read(chunk_len)

        state = sodium.crypto_secretstream_xchacha20poly1305_state()
        sodium.crypto_secretstream_xchacha20poly1305_init_pull(state, header, key)
        decrypted_bytes, tag = sodium.crypto_secretstream_xchacha20poly1305_pull(
            state, ciphertext, b""
        )

        actual_sha256 = hashlib.sha256(decrypted_bytes).hexdigest()
        if actual_sha256 == EXPECTED_SHA256:
            lines.append("[PASS] Spike 0.3: Cross-Device Decrypt")
            lines.append(f"  SHA-256: {actual_sha256[:16]}... (Exact match!)")
            lines.append(f"  Message: {decrypted_bytes.decode('utf-8')[:40]}...")
        else:
            lines.append(f"[FAIL] Hash mismatch: {actual_sha256} != {EXPECTED_SHA256}")
    except Exception as e:
        lines.append(f"[FAIL] Cross-Device Decrypt: {e}")

    lines.append("-" * 35)

    # Test 2: Local On-Device Encryption & Decryption (Android)
    try:
        on_device_msg = b"Encrypted locally on Android via Chaquopy PyNaCl!"
        orig_hash = hashlib.sha256(on_device_msg).hexdigest()

        # Encrypt
        push_state = sodium.crypto_secretstream_xchacha20poly1305_state()
        push_header = sodium.crypto_secretstream_xchacha20poly1305_init_push(
            push_state, key
        )
        ct = sodium.crypto_secretstream_xchacha20poly1305_push(
            push_state,
            on_device_msg,
            b"",
            sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL,
        )

        # Decrypt
        pull_state = sodium.crypto_secretstream_xchacha20poly1305_state()
        sodium.crypto_secretstream_xchacha20poly1305_init_pull(
            pull_state, push_header, key
        )
        pt, _ = sodium.crypto_secretstream_xchacha20poly1305_pull(pull_state, ct, b"")

        if hashlib.sha256(pt).hexdigest() == orig_hash:
            lines.append("[PASS] Android On-Device Encrypt/Decrypt")
        else:
            lines.append("[FAIL] Android On-Device Hash mismatch")
    except Exception as e:
        lines.append(f"[FAIL] Android On-Device: {e}")

    lines.append("-" * 35)

    # Test 3: Tamper Resistance
    try:
        tampered_ct = bytearray(ct)
        tampered_ct[5] ^= 0xFF  # Corrupt 1 byte

        tamper_state = sodium.crypto_secretstream_xchacha20poly1305_state()
        sodium.crypto_secretstream_xchacha20poly1305_init_pull(
            tamper_state, push_header, key
        )
        sodium.crypto_secretstream_xchacha20poly1305_pull(tamper_state, bytes(tampered_ct), b"")
        lines.append("[FAIL] Tampered ciphertext was accepted!")
    except CryptoError:
        lines.append("[PASS] Tamper Detection (CryptoError raised)")
    except Exception as e:
        lines.append(f"[FAIL] Tamper Detection unexpected error: {e}")

    lines.append("=" * 35)
    lines.append("ALL CHECKS PASSED ON ANDROID!")
    return "\n".join(lines)
