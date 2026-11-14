# SecureWorkspace

Open-source, client-side encrypted backup and sync. Files are encrypted on your device before upload, so Google Drive only ever stores ciphertext. You keep the keys, the storage account, the version history and the recovery material.

> **Status: Phase 5 Desktop App & Google OAuth Integration Complete.**  
> **101/101 unit & crypto vector tests passing** across unit, crypto vectors, daemon IPC, and Rust Tauri bridge.  
> **Currently Active: Phase 6 Web App & Zero-Server Read-Only Viewer.**  
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
- **Zero-Server Web App & In-Browser Viewer:** Unlock and view documents in any web browser without installing the desktop app. Argon2id KDF and chunk decryption execute client-side via WebAssembly in a Web Worker; rich document renderers display PDF, Excel, Word, CSV, Markdown, and Code directly in RAM.

---

## Architecture & Technology Stack

- **One Python Core (`secureworkspace-core`):** All cryptography, SQLite metadata, storage adapters, OAuth authentication, and sync engines reside in a single Python package.
- **Unified Public JSON API Facade:** Single dispatch point (`SecureWorkspaceAPI.dispatch()`) implementing the complete JSON-in / JSON-out contract for desktop IPC and mobile Chaquopy.
- **Headless Sidecar Daemon (`daemon.py`):** Communicates with host applications over newline-delimited JSON (NDJSON) via standard input/output. Bundled with PyInstaller for production distribution (end users never need Python installed).
- **Desktop UI (`apps/desktop`):** Tauri v2 (Rust shell) + Vite + React 19 + TypeScript + Tailwind CSS v4.
- **Web App & Viewer (`apps/web`):** Static Single Page Application (SPA) on Cloudflare Pages. React 19 + TypeScript + Tailwind CSS v4 + WebAssembly (`hash-wasm` & `libsodium-wrappers-sumo`).
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
│   ├── web/                 # React 19 + TS + Tailwind v4 + WASM client-side reader (Phase 6)
│   └── android/             # React Native + Chaquopy + Kotlin native bridge (Phase 7)
├── google outh clients/     # OAuth client configuration files (gitignored)
│   ├── client_secret_desktop.json  # Desktop OAuth Client (Installed App)
│   └── WEB_CLIENT_ID.json          # Web App OAuth Client (SPA)
├── specs/
│   └── encryption-format/   # Formal specification and test_vectors.json
├── spikes/                  # Phase 0 validation spikes (Desktop crypto, Chaquopy, Drive loopback)
├── tests/
│   ├── unit/                # 90+ fast deterministic unit tests (crypto, header, db, sync, daemon, oauth)
│   ├── integration/         # Multi-device sync lifecycle & live Google Drive roundtrip tests
│   └── vectors/             # Published test vector verification
└── docs/                    # PRD, specs, and implementation roadmaps (gitignored)
```

---

## Google Cloud Console Setup Guide

To connect SecureWorkspace to Google Drive, set up a project in Google Cloud Console:

### 1. Create a Google Cloud Project & Enable APIs
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project named **SecureWorkspace** (or your preferred name).
3. In the sidebar, navigate to **APIs & Services > Library**.
4. Search for **Google Drive API** and click **Enable**.

### 2. Configure OAuth Consent Screen
1. Go to **APIs & Services > OAuth consent screen**.
2. Select **External** user type and click **Create**.
3. Fill in:
   - **App Name:** `SecureWorkspace` (or `Cyber Shield Vault`)
   - **User support email:** Your email address
   - **Developer contact information:** Your email address
4. On the **Scopes** page, add the following scopes:
   - `https://www.googleapis.com/auth/drive.file` *(Restricted access strictly to files created/opened by this app)*
   - `https://www.googleapis.com/auth/userinfo.email` *(Used to display connected user badge)*
   - `openid`
5. On the **Test Users** page, add your Google account email to allow login while in development.

### 3. Create OAuth Credentials

You will create two separate OAuth 2.0 Client IDs:

#### A. Desktop Client ID (for Tauri Desktop App):
1. Go to **APIs & Services > Credentials > Create Credentials > OAuth client ID**.
2. Select Application type: **Desktop app**.
3. Name it: `SecureWorkspace Desktop`.
4. Click **Create**, then click **Download JSON**.
5. Save this file to:
   ```text
   google outh clients/client_secret_desktop.json
   ```
   *(This folder is `.gitignored` to prevent committing it to GitHub).*

#### B. Web Client ID (for Web App & Read-Only Viewer):
1. In **Credentials**, click **Create Credentials > OAuth client ID**.
2. Select Application type: **Web application**.
3. Name it: `SecureWorkspace Web`.
4. Under **Authorized JavaScript origins**, add:
   - `http://localhost:5173` *(for local Vite dev)*
   - `https://<your-subdomain>.harshdadiya.in` *(for Cloudflare Pages production)*
5. Under **Authorized redirect URIs**, add:
   - `http://localhost:5173`
   - `https://<your-subdomain>.harshdadiya.in`
6. Click **Create** and download the JSON as `google outh clients/WEB_CLIENT_ID.json`.

---

## Running the Applications

### 1. Desktop App (Tauri + React 19 + Python Daemon)
```powershell
cd apps/desktop
npm install
npm run tauri dev
```

### 2. Web App (Landing Page + In-Browser Viewer)
```powershell
cd apps/web
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

### 3. Run Automated Tests
```powershell
# Run all unit and cryptographic test vectors
.venv\Scripts\pytest tests\unit tests\vectors -v
```

---

## Build Time vs. Runtime Credentials FAQ

### **Q: Do we need user credentials when building the app?**
**No. Absolutely not.**

| Environment | What Is Needed | Are Secret User Credentials Required? |
| :--- | :--- | :--- |
| **Build Time** (`npm run build`, `scripts/build_desktop.ps1`) | Compiles TypeScript, CSS, Rust shell, and freezes sidecar daemon. | **NO.** You never need user credentials, passwords, or personal tokens to build. |
| **Desktop Client Secret** (`client_secret_desktop.json`) | Public OAuth Client ID registration from Google Cloud Console. | According to RFC 8252 (OAuth 2.0 for Native Apps), desktop apps are *public clients*. For developers, this file lives in `google outh clients/` (gitignored). When creating release builds with `scripts/bundle_daemon.py`, it is frozen into the daemon binary so end users never have to configure it. |
| **Web Client ID** (`WEB_CLIENT_ID.json`) | Public Web Client ID from Google Cloud Console. | Injected at build time via `VITE_GOOGLE_CLIENT_ID`. Web SPAs do **not** use or bundle client secrets; Google validates requests via whitelisted Authorized Origins. |
| **Runtime User Data** (`credentials.json`) | Generated only when the user logs into their Google account. | Stored in the user's OS profile (`%LOCALAPPDATA%\SecureWorkspace\credentials.json`). It is created strictly at runtime and deleted on logout. |

---

## Implementation Roadmap

- [x] **Phase 0: Validation Spikes** (Desktop Argon2id + SecretStream, Android Chaquopy 17.2 ARM64 cross-device decrypt, Google Drive OAuth loopback).
- [x] **Phase 1: Core Encryption Library** (BIP-39 24-word recovery, dual-path key wrapping, fixed 246-byte `SWH1` header, 64 KB chunked `SWF1` streaming, encrypted catalog `SWC1`, formal test vectors).
- [x] **Phase 2: Drive Storage Adapter** (Abstract `StorageAdapter`, `MockStorageAdapter`, production `GoogleDriveStorageAdapter` with 256 KiB resumable uploads, exponential backoff with jitter, and live E2E verification).
- [x] **Phase 3: Workspace & SQLite Metadata Engine** (WAL mode SQLite, zero-plaintext paths at rest with `SecretBox(meta_key)` and keyed BLAKE2b digests, layout & process lock manager, two-tier change detector, safe temp manager, database rebuilder).
- [x] **Phase 4: Git-Style Pull, Push and Revert** (Version manifests in `versions/`, `HEAD` version tracking, read-only `status()`, `pull()` with safety snapshots, `push()` with atomic race pre-check and mass-deletion guard, `force_push()`, and `revert()`).
- [x] **Phase 5: Desktop App & Packaging** (Tauri v2 Rust bridge, React 19 UI with 14 components/views, desktop Google OAuth loopback flow, NSIS Windows installer bundling).
- [ ] **Phase 6: Web App & Zero-Server Read-Only Viewer** (Product landing page, Google Identity Services OAuth, in-browser Argon2id WASM in Web Worker, 64 KB chunk SecretStream decryptor, Mozilla PDF.js, SheetJS Excel, PapaParse CSV, docx-preview Word, Prism.js code viewer, Cloudflare Pages on custom subdomain).
- [ ] **Phase 7: Android App** (React Native UI, Kotlin Chaquopy bridge, Android Keystore wrapped key protection, share sheet / file picker integration).
- [ ] **Phase 8: External Backups & History Retention** (90-day version retention pruning, external HDD encrypted snapshot export, offline recovery drill).
- [ ] **Phase 9: Security Hardening & Release** (Formal crypto audit, fuzzing, dependency audit, open-source packaging).

---

## License

Open Source (License to be determined prior to public 1.0 release).
