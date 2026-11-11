# SecureWorkspace

Open-source, client-side encrypted backup and sync. Files are encrypted on your device before upload, so Google Drive only ever stores ciphertext. You keep the keys, the storage account, the version history and the recovery material.

> **Status: Phase 5 Desktop App & Google OAuth Integration Complete.**  
> **100/100 tests passing** across unit, crypto vectors, daemon IPC, live Drive integration, and Rust Tauri bridge.  
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
- **Integrated Desktop Google OAuth:** Direct browser consent flow with silent token auto-refresh and persistent local credential storage.

---

## Architecture & Technology Stack

- **One Python Core (`secureworkspace-core`):** All cryptography, SQLite metadata, storage adapters, OAuth authentication, and sync engines reside in a single Python package.
- **Unified Public JSON API Facade:** Single dispatch point (`SecureWorkspaceAPI.dispatch()`) implementing the complete JSON-in / JSON-out contract for desktop IPC and mobile Chaquopy.
- **Headless Sidecar Daemon (`daemon.py`):** Communicates with host applications over newline-delimited JSON (NDJSON) via standard input/output. Bundled with PyInstaller for production distribution (end users never need Python installed).
- **Desktop UI (`apps/desktop`):** Tauri v2 (Rust shell) + Vite + React 19 + TypeScript + Tailwind CSS v4.
- **Mobile UI (`apps/android`):** React Native + Chaquopy (Python core embedded on Android).
- **Identity & Zero Custody:** Direct OAuth2 with user's Google account. No SecureWorkspace backend server, custodian accounts, or hosted databases.

---

## Repository Structure

```text
secureworkspace/
├── core/secureworkspace_core/
│   ├── auth/                # Google OAuth 2.0 InstalledAppFlow, token refresh, discovery
│   ├── crypto/              # BIP-39 wordlist & recovery, Argon2id KDF, key wrapping, SecretStream
│   ├── storage/             # StorageAdapter interface, MockStorageAdapter, production GoogleDriveStorageAdapter
│   ├── sync/                # Version manifests, status engine, pull, push, revert, snapshots
│   ├── workspace/           # SWH1 header, catalog, zero-plaintext SQLite DB, change detector, temp manager
│   ├── api.py               # Unified JSON-in / JSON-out facade (Chaquopy & daemon dispatch)
│   └── daemon.py            # Headless NDJSON IPC daemon for desktop & CLI hosts
├── apps/
│   ├── desktop/             # Tauri v2 + React 19 + TypeScript + Tailwind CSS desktop app
│   │   ├── src/             # React views: Wizard, Dashboard, Files, Diverged Modal, Settings
│   │   └── src-tauri/       # Rust shell & daemon IPC manager (daemon.rs, lib.rs)
│   └── android/             # React Native + Chaquopy + Kotlin native bridge (Phase 6)
├── google outh clients/     # OAuth desktop client secrets (gitignored)
├── specs/
│   └── encryption-format/   # Formal specification and test_vectors.json
├── spikes/                  # Phase 0 validation spikes (Desktop crypto, Chaquopy, Drive loopback)
├── tests/
│   ├── unit/                # 90+ fast deterministic unit tests (crypto, header, db, sync, daemon, oauth)
│   ├── integration/         # Multi-device sync lifecycle & live Google Drive roundtrip tests
│   └── vectors/             # Published test vector verification
└── docs/                    # PRD, project status, and architecture logs (gitignored)
```

---

## Running & Testing the Desktop App

### 1. Run the Full Native Desktop App (Tauri Window)
Launches the native desktop window with the React 19 frontend and automatically starts the background Python daemon:

```powershell
cd apps/desktop
npm install
npm run tauri dev
```

*What you can test in the desktop app:*
- **Create Workspace Wizard:** 5-step onboarding wizard (Workspace Name, Master Password, 24-Word Recovery Grid, Recovery Verification Test, and Google Drive Authorization).
- **Live Google OAuth:** Click **"Authorize Google Drive"** to trigger the browser consent flow (`drive.file` scope). When granted, UI automatically updates to `✓ Connected as user@gmail.com`.
- **Sync & Dashboard Views:** View donut version ring, changes table (Added, Changed, Deleted), and status pills.
- **Settings & Security:** View connection status, switch Google accounts, or disconnect.

---

### 2. Run in Browser Dev Mode (Rapid UI Preview)
For UI-only development and rapid hot-reloading in any web browser with built-in mock fallback:

```powershell
cd apps/desktop
npm run dev
```
Open **`http://localhost:1420`** in your browser.

---

### 3. Run Automated Tests

```powershell
# 1. Full Python Core Test Suite (100/100 tests passing)
& 'D:\Projects\SecureWorkspace\.venv\Scripts\python.exe' -m pytest -v

# 2. Rust-to-Python IPC Daemon Integration Test
cd apps/desktop/src-tauri
cargo test
```

---

## Build Time vs. Runtime Credentials FAQ

### **Q: Do we need user credentials when building the app?**
**No. Absolutely not.**

Here is the exact security distinction between build-time and runtime:

| Phase | What Is Needed | Are Secret User Credentials Required? |
| :--- | :--- | :--- |
| **Build Time** (`npm run build`, `npm run tauri build`, `cargo build`) | Compiles TypeScript, CSS, Rust shell, and bundles the sidecar. | **NO.** You never need user credentials, passwords, or `token.json` files to build or package the application. |
| **Client Secrets** (`client_secret_desktop.json`) | Public OAuth Client ID registration from Google Cloud Console. | According to RFC 8252 (OAuth 2.0 for Native Apps), desktop apps are *public clients*. Client secrets for desktop clients are app identifiers, not private user secrets. For developers, this file lives in `google outh clients/client_secret_desktop.json` (gitignored). |
| **Runtime** (User running the installed app) | User authorizes their own Google Drive account via browser popup. | User credentials (`credentials.json` with access & refresh tokens) are generated **only at runtime** on the user's local machine and stored in `%LOCALAPPDATA%\SecureWorkspace\credentials.json`. They are never baked into builds. |

---

## Security Model & Invariants

- **Client-Side Zero-Knowledge:** Plaintext is never uploaded to Drive or stored unencrypted on disk. All files and directory names are encrypted prior to I/O.
- **Traffic Analysis:** Drive and network observers can observe file sizes, access timestamps, and account identity, but never contents or file paths.
- **Local Device Protection:** Active files are decrypted to managed temporary files only while open in an external editor and securely zeroed out on save or lock.
- **Permanent Loss Guarantee:** If both the master password and the 24-word recovery phrase are lost, data cannot be recovered by design.

---

## Implementation Roadmap

- [x] **Phase 0: Validation Spikes** (Desktop Argon2id + SecretStream, Android Chaquopy 17.2 ARM64 cross-device decrypt, Google Drive OAuth loopback).
- [x] **Phase 1: Core Encryption Library** (BIP-39 24-word recovery, dual-path key wrapping, fixed 246-byte `SWH1` header, 64 KB chunked `SWF1` streaming, encrypted catalog `SWC1`, formal test vectors).
- [x] **Phase 2: Drive Storage Adapter** (Abstract `StorageAdapter`, `MockStorageAdapter`, production `GoogleDriveStorageAdapter` with 256 KiB resumable uploads, exponential backoff with jitter, and live E2E verification).
- [x] **Phase 3: Workspace & SQLite Metadata Engine** (WAL mode SQLite, zero-plaintext paths at rest with `SecretBox(meta_key)` and keyed BLAKE2b digests, layout & process lock manager, two-tier change detector, safe temp manager, database rebuilder).
- [x] **Phase 4: Git-Style Pull, Push and Revert** (Version manifests in `versions/`, `HEAD` version tracking, read-only `status()`, `pull()` with safety snapshots, `push()` with atomic race pre-check and mass-deletion guard, `force_push()`, and `revert()`).
- [x] **Phase 5 Part 1: Unified JSON API Facade** (Standard JSON-in / JSON-out envelope contract across Chaquopy and desktop).
- [x] **Phase 5 Part 2A: Sidecar Daemon** (Headless stdin/stdout NDJSON IPC process).
- [x] **Phase 5 Part 2B: Tauri Desktop App & Design System** (Tauri v2 Rust bridge, React 19 UI with 5 screens: Wizard, Dashboard, Files, Diverged Modal, Settings).
- [x] **Phase 5 Part 2C: Desktop Google OAuth Integration** (Browser consent loop, auto-refresh, UI state wiring, 100/100 tests passing).
- [ ] **Phase 6: Android App** (React Native UI, Kotlin Chaquopy bridge, Android Keystore wrapped key protection, share sheet / file picker integration).
- [ ] **Phase 7: External Backups & History Retention** (90-day version retention pruning, external HDD encrypted snapshot export, offline recovery drill).
- [ ] **Phase 8: Security Hardening & Release** (Formal crypto audit, fuzzing, dependency audit, open-source packaging).

---

## License

Open Source (License to be determined prior to public 1.0 release).
