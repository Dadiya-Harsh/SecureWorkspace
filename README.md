# SecureWorkspace

Open-source, client-side encrypted backup and sync. Files are encrypted on your device before upload, so Google Drive only ever stores ciphertext. You keep the keys, the storage account, the version history and the recovery material.

> **Status: Core Engine Complete (Phases 0 through 4 Completed; Entering Phase 5 UI).**  
> 84/84 tests passing across unit, vector, integration, and live Google Drive roundtrips.  
> Not yet independently security-reviewed. Do not put real personal documents in it yet.

---

## What It Does

- **Client-Side Zero-Knowledge Encryption:** Files are encrypted into memory-bounded 64 KB chunks (`SWF1` streaming SecretStream envelope) before leaving the device. Google Drive only sees random ciphertext.
- **Dual-Path Key Hierarchy:** Both a user master password (Argon2id) and a 24-word BIP-39 recovery phrase unwrap the same 256-bit Workspace Master Key (WMK). Contains an embedded 2048-word dictionary and 8-bit checksum verification.
- **Zero-Plaintext Metadata at Rest:** File paths and folder structures are never written in plaintext to disk or cloud. SQLite encrypts paths with `SecretBox(meta_key)` and indexes lookups via keyed BLAKE2b digests (`path_hash`).
- **Git-Style Sync Remote:**
  - **`status()`:** Strictly read-only check reporting unpushed local changes, remote versions ahead, and diverged state.
  - **`pull(confirm=True)`:** Stages downloads, creates local safety snapshots of unpushed/modified files before replacing them, and verifies streaming SHA-256 integrity.
  - **`push(message)`:** Encrypts and uploads immutable objects, uploads encrypted version manifests, verifies remote `HEAD` against concurrent push race conditions, and guards against mass deletions.
  - **`force_push(confirm=True)`:** Advances remote HEAD with local changes without destroying history.
  - **`revert(version)`:** Non-destructively rolls back entire workspace to any earlier Drive version as staged unpushed changes.
  - **`restore_file_version()`:** Granular single-file historical recovery with pre-restore safety snapshots.
- **Storage Independence & Least Privilege:** Google Drive adapter uses `drive.file` scope restricted strictly to a dedicated app folder with automated boundary checks.

---

## Architecture & Technology Stack

- **One Python Core (`secureworkspace-core`):** All cryptography, SQLite metadata, storage adapters, and sync engines reside in a single Python package. 
- **100% Dependency-Free:** Beyond `PyNaCl`, `requests`, and standard library modules (`sqlite3`, `hashlib`, `secrets`), the core has zero third-party dependencies.
- **Desktop (Phase 5):** PySide6 UI directly calling the core engine on background worker threads.
- **Mobile (Phase 6):** React Native (TypeScript) with Chaquopy embedding the Python core natively inside the Android APK. Proven on physical ARM64 devices with cross-device cryptographic parity.
- **Identity:** Direct OAuth2 with user's Google account. No SecureWorkspace backend server and no custodian accounts.

---

## Repository Structure

```text
secureworkspace/
├── core/secureworkspace_core/
│   ├── crypto/              # BIP-39 wordlist & recovery, Argon2id KDF, key wrapping, SecretStream
│   ├── workspace/           # SWH1 header, catalog, file ops, zero-plaintext SQLite DB, change detector, temp manager
│   ├── storage/             # Abstract adapter, MockStorageAdapter, production GoogleDriveStorageAdapter
│   └── sync/                # Version manifests, status engine, pull engine, push engine, revert engine
├── apps/
│   ├── desktop/             # PySide6 application (Phase 5)
│   └── android/             # React Native + Chaquopy + Kotlin native bridge (Phase 6)
├── specs/
│   └── encryption-format/   # Formal specification and test_vectors.json
├── spikes/                  # Phase 0 validation spikes (Desktop crypto, Chaquopy, Drive loopback)
├── tests/
│   ├── unit/                # 70+ fast deterministic unit tests (< 4s)
│   ├── integration/         # Multi-device sync lifecycle & live Google Drive roundtrip tests
│   └── vectors/             # Published test vector verification
└── docs/                    # PRD, project status, and architecture logs
```

---

## Development Setup

Requires Python 3.10+ (tested and pinned to Python 3.12.12 via `uv` for 100% Chaquopy compatibility) and Git.

```bash
# Clone the repository
git clone https://github.com/<your-username>/secureworkspace.git
cd secureworkspace

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate       # On Windows PowerShell: .venv\Scripts\Activate.ps1

# Install core and development dependencies
pip install -e "core[dev]"

# Run full unit and vector test suite (< 5.0s)
pytest tests/unit tests/vectors

# Run entire suite including integration tests
pytest
```

---

## Implementation Roadmap

- [x] **Phase 0: Validation Spikes** (Desktop Argon2id + SecretStream, Android Chaquopy 17.2 ARM64 cross-device decrypt, Google Drive OAuth loopback).
- [x] **Phase 1: Core Encryption Library** (BIP-39 24-word recovery, dual-path key wrapping, fixed 246-byte `SWH1` header, 64 KB chunked `SWF1` streaming, encrypted catalog `SWC1`, formal test vectors).
- [x] **Phase 2: Drive Storage Adapter** (Abstract `StorageAdapter`, `MockStorageAdapter`, production `GoogleDriveStorageAdapter` with 256 KiB resumable uploads, exponential backoff with jitter, and live E2E verification).
- [x] **Phase 3: Workspace & SQLite Metadata Engine** (WAL mode SQLite, zero-plaintext paths at rest with `SecretBox(meta_key)` and keyed BLAKE2b digests, layout & process lock manager, two-tier change detector, safe temp manager, database rebuilder).
- [x] **Phase 4: Git-Style Pull, Push and Revert** (Version manifests in `versions/`, `HEAD` version tracking, read-only `status()`, `pull()` with safety snapshots, `push()` with atomic race pre-check and mass-deletion guard, `force_push()`, and `revert()`).
- [ ] **Phase 5: Desktop App** (PySide6 desktop UI, Core JSON API contract facade, setup wizard with mandatory recovery test, file browser, sync dashboard).
- [ ] **Phase 6: Android App** (React Native UI, Kotlin Chaquopy bridge, Android Keystore wrapped key protection, share sheet / file picker integration).
- [ ] **Phase 7: External Backups & History Retention** (90-day version retention pruning, external HDD encrypted snapshot export, offline recovery drill).
- [ ] **Phase 8: Security Hardening & Release** (Formal crypto audit, fuzzing, dependency audit, open-source packaging).

---

## Security Model & Honest Limitations

- **Client-Side Encryption:** Plaintext is never uploaded to Drive or stored unencrypted on disk.
- **Traffic Analysis:** Drive and network observers can still observe file sizes, access timestamps, and account identity.
- **Local Device Compromise:** Opened files are decrypted to managed temporary files while being edited. A compromised or unlocked device can access open files.
- **Permanent Loss Guarantee:** If both the master password and the 24-word recovery phrase are lost, data cannot be recovered by anyone by design.

---

## License

Open Source (License to be determined prior to public 1.0 release).
