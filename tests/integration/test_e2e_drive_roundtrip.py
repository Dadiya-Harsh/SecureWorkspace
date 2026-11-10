"""
End-to-End Live Integration Test for Phase 1 (Crypto) & Phase 2 (Drive Storage Adapter).

Demonstrates and verifies:
1. Key generation & Argon2id header wrapping (Phase 1)
2. Streaming file encryption of small (<5MB) and large (>5MB) files (Phase 1)
3. Live Google Drive connection and app folder boundary (Phase 2)
4. Multipart upload for small files and chunked resumable upload for 6MB file (Phase 2)
5. Remote listing and metadata inspection on Drive (Phase 2)
6. Clean-device simulated restore: streaming download from Drive + local decryption
7. 100% SHA-256 verification and bit-tamper rejection
8. Remote cleanup of test objects from Google Drive
"""

import hashlib
import os
import sys
import tempfile
import time
import uuid

# Ensure core package is on sys.path when run directly
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "core"))

import pytest
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from nacl.exceptions import CryptoError
import nacl.utils

from secureworkspace_core.constants import CHUNK_SIZE, SALT_BYTES
from secureworkspace_core.crypto.kdf import derive_kek_from_password
from secureworkspace_core.crypto.keys import generate_wmk, wrap_wmk, unwrap_wmk
from secureworkspace_core.storage.drive import GoogleDriveStorageAdapter
from secureworkspace_core.workspace.file_ops import decrypt_file, encrypt_file

TOKEN_FILE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "spikes",
    "spike_06_drive",
    "token.json",
)


def get_live_token_provider():
    if not os.path.exists(TOKEN_FILE):
        return None

    def token_provider() -> str:
        creds = Credentials.from_authorized_user_file(TOKEN_FILE)
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            with open(TOKEN_FILE, "w") as f:
                f.write(creds.to_json())
        return creds.token

    return token_provider


def compute_sha256(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(CHUNK_SIZE):
            h.update(chunk)
    return h.hexdigest()


@pytest.mark.skipif(
    not os.path.exists(TOKEN_FILE),
    reason="Live Drive E2E test requires token.json",
)
def test_e2e_drive_encrypt_upload_download_decrypt():
    run_e2e_flow(verbose=False)


def run_e2e_flow(verbose: bool = True):
    def log(msg: str):
        if verbose:
            print(msg)

    token_provider = get_live_token_provider()
    if not token_provider:
        print(f"Error: Token file not found at {TOKEN_FILE}. Run spike 0.6 first.")
        sys.exit(1)

    log("=" * 70)
    log("SECUREWORKSPACE: PHASE 1 & PHASE 2 END-TO-END DRIVE INTEGRATION TEST")
    log("=" * 70)

    with tempfile.TemporaryDirectory() as base_dir:
        device1_dir = os.path.join(base_dir, "device1_client")
        device2_dir = os.path.join(base_dir, "device2_clean_restore")
        os.makedirs(device1_dir)
        os.makedirs(device2_dir)

        # -------------------------------------------------------------
        # STEP 1: Key Setup & Hierarchy
        # -------------------------------------------------------------
        log("\n[1] Initializing Workspace Master Key & Password KDF...")
        master_password = "SuperSecretMasterPassword2026!"
        salt = nacl.utils.random(SALT_BYTES)
        kek = derive_kek_from_password(master_password, salt)
        wmk = generate_wmk()

        # Wrap WMK
        nonce, wrapped_wmk = wrap_wmk(wmk, kek)
        # Verify unwrap
        recovered_wmk = unwrap_wmk(wrapped_wmk, nonce, kek)
        assert recovered_wmk == wmk
        log("    -> Master key derived and verified successfully.")

        # -------------------------------------------------------------
        # STEP 2: Generate Test Files (Small Document + 6MB Resumable)
        # -------------------------------------------------------------
        log("\n[2] Generating test payload files on Device 1...")
        file1_path = os.path.join(device1_dir, "document.json")
        file2_path = os.path.join(device1_dir, "large_archive.dat")

        # File 1: 512 KB realistic JSON document
        json_content = ('{"title": "SecureWorkspace Confidential Report", "records": ' +
                        str([{"id": i, "val": f"confidential_data_entry_{i}"} for i in range(15000)]) +
                        '}').encode("utf-8")
        with open(file1_path, "wb") as f:
            f.write(json_content)
        file1_size = len(json_content)
        file1_hash = compute_sha256(file1_path)
        log(f"    File 1 (Small): {file1_path} ({file1_size / 1024:.1f} KB, SHA-256: {file1_hash[:16]}...)")

        # File 2: 6 MiB binary payload (> 5 MiB threshold for chunked resumable upload)
        file2_size = 6 * 1024 * 1024
        log(f"    File 2 (Large): Generating {file2_size / (1024*1024):.1f} MB payload to trigger Drive resumable chunking...")
        with open(file2_path, "wb") as f:
            chunk = os.urandom(64 * 1024)
            for _ in range(file2_size // len(chunk)):
                f.write(chunk)
        file2_hash = compute_sha256(file2_path)
        log(f"    File 2 (Large): {file2_path} ({file2_size / (1024*1024):.1f} MB, SHA-256: {file2_hash[:16]}...)")

        # -------------------------------------------------------------
        # STEP 3: Client-side Encryption (SWF1 format)
        # -------------------------------------------------------------
        log("\n[3] Encrypting files locally before upload (Zero-Knowledge)...")
        file1_id = uuid.uuid4().bytes
        file2_id = uuid.uuid4().bytes

        file1_enc_path = os.path.join(device1_dir, "document.json.enc")
        file2_enc_path = os.path.join(device1_dir, "large_archive.dat.enc")

        t0 = time.time()
        meta1 = encrypt_file(file1_path, file1_enc_path, wmk, file_id=file1_id)
        meta2 = encrypt_file(file2_path, file2_enc_path, wmk, file_id=file2_id)
        enc_duration = time.time() - t0

        log(f"    -> Encrypted 2 files in {enc_duration:.2f}s.")
        log(f"    File 1 Ciphertext: {meta1.ciphertext_size} bytes (SWF1 envelope)")
        log(f"    File 2 Ciphertext: {meta2.ciphertext_size} bytes (SWF1 envelope)")

        # -------------------------------------------------------------
        # STEP 4: Connect to Google Drive & Upload
        # -------------------------------------------------------------
        log("\n[4] Connecting to Google Drive via GoogleDriveStorageAdapter...")
        adapter = GoogleDriveStorageAdapter(token_provider=token_provider)
        folder_id = adapter.ensure_app_folder()
        log(f"    -> Connected! Isolated Drive Root Folder: ID = {folder_id}")

        uploaded_remote_ids = []
        try:
            # Upload File 1 (Multipart upload)
            remote_name_1 = f"e2e_test_file1_{uuid.uuid4().hex[:8]}.enc"
            log(f"\n[5] Uploading File 1 ({meta1.ciphertext_size} bytes, Multipart) to Google Drive...")
            t0 = time.time()
            remote_file_1 = adapter.upload_file(
                local_path=file1_enc_path,
                remote_name=remote_name_1,
            )
            uploaded_remote_ids.append(remote_file_1.id)
            log(f"    -> Upload Complete in {time.time() - t0:.2f}s! Remote ID = {remote_file_1.id}")

            # Upload File 2 (Resumable chunked upload: 6 MB, 1 MB chunks)
            remote_name_2 = f"e2e_test_file2_{uuid.uuid4().hex[:8]}.enc"
            log(f"\n[6] Uploading File 2 ({meta2.ciphertext_size / (1024*1024):.2f} MB, Resumable Chunks) to Google Drive...")
            t0 = time.time()
            
            def upload_progress(uploaded: int, total: int):
                pct = (uploaded / total) * 100 if total else 0
                log(f"       [Upload Progress] {uploaded / (1024*1024):.2f}/{total / (1024*1024):.2f} MB ({pct:.1f}%)")

            remote_file_2 = adapter.upload_file(
                local_path=file2_enc_path,
                remote_name=remote_name_2,
                progress_callback=upload_progress,
            )
            uploaded_remote_ids.append(remote_file_2.id)
            upload_speed = (meta2.ciphertext_size / (1024*1024)) / (time.time() - t0)
            log(f"    -> Resumable Upload Complete in {time.time() - t0:.2f}s ({upload_speed:.2f} MB/s)! Remote ID = {remote_file_2.id}")

            # -------------------------------------------------------------
            # STEP 5: Verify Remote Listing on Drive
            # -------------------------------------------------------------
            log("\n[7] Querying Google Drive file listing inside SecureWorkspace folder...")
            drive_files = adapter.list_files()
            drive_file_ids = {df.id: df.name for df in drive_files}
            assert remote_file_1.id in drive_file_ids
            assert remote_file_2.id in drive_file_ids
            log(f"    -> Found {len(drive_files)} total files in Drive app folder.")
            log(f"    -> Verified File 1: '{remote_file_1.name}' on Drive.")
            log(f"    -> Verified File 2: '{remote_file_2.name}' on Drive.")

            # -------------------------------------------------------------
            # STEP 6: Simulated Clean-Device Restore (Device 2)
            # -------------------------------------------------------------
            log("\n[8] Simulating Clean Restore on Device 2 (Download from Drive + Decrypt)...")
            file1_dl_enc = os.path.join(device2_dir, "downloaded_file1.enc")
            file2_dl_enc = os.path.join(device2_dir, "downloaded_file2.enc")

            # Stream download from Drive
            log("    Downloading File 1 stream from Drive...")
            t0 = time.time()
            adapter.download_file(remote_file_1.id, file1_dl_enc)
            log(f"    -> File 1 downloaded in {time.time() - t0:.2f}s ({os.path.getsize(file1_dl_enc)} bytes).")

            log("    Downloading File 2 stream from Drive...")
            t0 = time.time()

            def dl_progress(downloaded: int, total: int):
                pct = (downloaded / total) * 100 if total else 0
                if downloaded == total or downloaded % (1024 * 1024) < 65536:
                    log(f"       [Download Progress] {downloaded / (1024*1024):.2f}/{total / (1024*1024):.2f} MB ({pct:.1f}%)")

            adapter.download_file(remote_file_2.id, file2_dl_enc, progress_callback=dl_progress)
            dl_speed = (os.path.getsize(file2_dl_enc) / (1024*1024)) / (time.time() - t0)
            log(f"    -> File 2 downloaded in {time.time() - t0:.2f}s ({dl_speed:.2f} MB/s, {os.path.getsize(file2_dl_enc)} bytes).")

            # Decrypt downloaded files on Device 2
            log("\n[9] Decrypting downloaded ciphertexts on Device 2 with WMK...")
            file1_restored_path = os.path.join(device2_dir, "document_restored.json")
            file2_restored_path = os.path.join(device2_dir, "large_archive_restored.dat")

            dec_hash_1 = decrypt_file(file1_dl_enc, file1_restored_path, wmk, file1_id)
            dec_hash_2 = decrypt_file(file2_dl_enc, file2_restored_path, wmk, file2_id)

            # -------------------------------------------------------------
            # STEP 7: Integrity & Hash Verification
            # -------------------------------------------------------------
            log("\n[10] Verifying End-to-End Cryptographic Integrity...")
            log(f"    File 1 Original SHA-256:  {file1_hash}")
            log(f"    File 1 Decrypted SHA-256: {dec_hash_1}")
            assert dec_hash_1 == file1_hash
            assert compute_sha256(file1_restored_path) == file1_hash
            log("    -> [PASS] File 1 SHA-256 matches 100% exactly!")

            log(f"    File 2 Original SHA-256:  {file2_hash}")
            log(f"    File 2 Decrypted SHA-256: {dec_hash_2}")
            assert dec_hash_2 == file2_hash
            assert compute_sha256(file2_restored_path) == file2_hash
            log("    -> [PASS] File 2 (6 MB) SHA-256 matches 100% exactly!")

            # -------------------------------------------------------------
            # STEP 8: Tamper Detection Verification
            # -------------------------------------------------------------
            log("\n[11] Testing Tamper Resistance against Bit Modification...")
            tampered_enc_path = os.path.join(device2_dir, "tampered.enc")
            with open(file1_dl_enc, "rb") as f_in, open(tampered_enc_path, "wb") as f_out:
                data = bytearray(f_in.read())
                # Flip bits in the middle of ciphertext
                data[len(data) // 2] ^= 0xFF
                f_out.write(data)

            tampered_out = os.path.join(device2_dir, "tampered_out.bin")
            tamper_caught = False
            try:
                decrypt_file(tampered_enc_path, tampered_out, wmk, file1_id)
            except CryptoError:
                tamper_caught = True
                log("    -> [PASS] Modified ciphertext was instantly rejected by Poly1305 MAC!")

            assert tamper_caught, "Expected CryptoError when decrypting tampered data"

        finally:
            # -------------------------------------------------------------
            # STEP 9: Remote Cleanup
            # -------------------------------------------------------------
            log("\n[12] Cleaning up test objects from Google Drive...")
            for fid in uploaded_remote_ids:
                try:
                    adapter.delete_file(fid)
                    log(f"    -> Deleted temporary file ID = {fid}")
                except Exception as e:
                    log(f"    -> Warning: Failed to clean up {fid}: {e}")

    log("\n" + "=" * 70)
    log("ALL END-TO-END DRIVE INTEGRATION TESTS PASSED WITH 100% SUCCESS!")
    log("=" * 70)


if __name__ == "__main__":
    run_e2e_flow(verbose=True)
