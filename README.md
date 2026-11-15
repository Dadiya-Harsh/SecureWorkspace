# SecureWorkspace

Open-source, client-side encrypted cloud workspace with zero-knowledge architecture. Files are encrypted on your local device before upload, ensuring Google Drive only ever stores random ciphertext. You keep the master password, the 24-word recovery phrase, the version history, and the encryption keys.

🌐 **Live Web App & Viewer:** [https://secureworkspace.harshdadiya.in](https://secureworkspace.harshdadiya.in)  
📦 **Desktop Installer (Windows x64):** Available in [GitHub Releases](https://github.com/Dadiya-Harsh/SecureWorkspace/releases/latest)

---

## Key Features

- **Client-Side Zero-Knowledge Encryption:** Files are encrypted into 64 KB memory-bounded chunks using the `SWF1` streaming SecretStream envelope (`crypto_secretstream_xchacha20poly1305`) before leaving your device. Google Drive never sees plaintext.
- **Dual-Path Key Hierarchy:** Both your master password (Argon2id) and an emergency 24-word BIP-39 recovery phrase unwrap the same 256-bit Workspace Master Key (WMK).
- **Multi-Workspace Isolation in Google Drive:** Workspaces are isolated into dedicated subfolders (`SecureWorkspace/<WorkspaceName>/`), each with its own `workspace.header`, version manifests, and encrypted object store.
- **Git-Style Version Control:**
  - `status()`: Read-only check reporting unpushed local changes, remote versions ahead, and diverged states.
  - `push(message)`: Atomically commits and uploads immutable encrypted object chunks and version manifests.
  - `pull()`: Downloads remote updates non-destructively, taking automated local safety snapshots of modified files.
  - `revert(version)`: Rolls back entire workspaces or restores individual files from past version snapshots.
- **Zero-Plaintext Metadata at Rest:** File paths and folder hierarchies are encrypted at rest inside a local WAL-mode SQLite metadata engine. Lookups use keyed BLAKE2b digests (`path_hash`).
- **Zero-Server In-Browser Web Viewer:** Open and view your encrypted files in any browser on [secureworkspace.harshdadiya.in](https://secureworkspace.harshdadiya.in) without installing desktop software. Decryption runs inside a sandboxed Web Worker via WebAssembly.
- **Rich Document Viewers:** Direct in-RAM preview for Word documents (`.docx`), Excel spreadsheets (`.xlsx`), PDFs (`.pdf`), CSV tables (`.csv`), Markdown (`.md`), Code files (`.ts`, `.py`, `.json`, `.js`), and images (`.png`, `.jpg`).
- **Least-Privilege Cloud Storage:** Restricted strictly to Google Drive's `drive.file` scope (the app can only access folders and files it created, never your personal drive contents).

---

## System Architecture

```text
┌────────────────────────────────────────────────────────┐
│                   Zero-Trust Boundary                  │
└───────────────────────────┬────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │                               │
            ▼                               ▼
 ┌──────────────────────┐        ┌──────────────────────┐
 │     Desktop App      │        │   Web App / Viewer   │
 │   (Tauri v2 + Rust)  │        │ (Cloudflare Pages SPA)│
 └──────────┬───────────┘        └──────────┬───────────┘
            │                               │
            ▼                               ▼
 ┌──────────────────────┐        ┌──────────────────────┐
 │ Python Sidecar Core  │        │   WASM Web Worker    │
 │ (Argon2id, SQLite,   │        │ (Argon2id, libsodium │
 │  PyNaCl, Drive API)  │        │  XChaCha20-Poly1305) │
 └──────────┬───────────┘        └──────────┬───────────┘
            │                               │
            └───────────────┬───────────────┘
                            ▼
              ┌───────────────────────────┐
              │    Google Drive Storage   │
              │  (Ciphertext & Manifests) │
              │                           │
              │  SecureWorkspace/         │
              │  └── <WorkspaceName>/     │
              │      ├── workspace.header │
              │      ├── HEAD             │
              │      ├── versions/        │
              │      └── objects/         │
              └───────────────────────────┘
```

---

## User Guide & Walkthrough

### 1. Using the Desktop App (Windows Authoring & Sync)

1. **Install:** Download and run `SecureWorkspace_0.1.0_x64-setup.exe` from [GitHub Releases](https://github.com/Dadiya-Harsh/SecureWorkspace/releases/latest).
2. **Create a Workspace:**
   - Choose a local folder for your workspace (e.g. `D:\PersonalVault`).
   - Set a strong master password (used for daily unlocking).
   - Write down or save your **24-word recovery phrase** (used for emergency recovery or web access).
   - Complete the quick 3-word verification drill.
3. **Add Files:** Drop any sensitive documents (spreadsheets, agreements, PDFs, images) into your workspace directory.
4. **Connect Google Drive:**
   - Click **Connect Google Drive** in the sidebar or top bar.
   - Authorize through your browser with the Google OAuth consent popup.
5. **Sync / Push:**
   - Click **Push** (with an optional commit message).
   - Your files are encrypted locally and uploaded to `SecureWorkspace/<WorkspaceName>/` in your Google Drive.

---

### 2. Using the Web Viewer (Instant Read-Only Decryption)

1. **Open the Web App:** Visit [https://secureworkspace.harshdadiya.in/viewer](https://secureworkspace.harshdadiya.in/viewer).
2. **Connect Google Drive:** Click **Continue with Google** and select your Google account.
3. **Select Workspace:** If you have multiple workspaces, choose the one you want to view from the workspace selector.
4. **Unlock:**
   - **With Password:** Enter your master password.
   - **With Recovery Key:** Or toggle to paste your 24-word recovery phrase.
   - Key derivation runs locally in browser RAM via Argon2id WebAssembly.
5. **Explore & Preview:**
   - Browse your folder hierarchy and version history.
   - Click any document to preview it live in memory without writing decrypted plaintext to disk.
   - Auto-lock automatically purges keys from browser memory after inactivity.

---

## Repository Structure

```text
SecureWorkspace/
├── core/secureworkspace_core/     # Unified Python Cryptography & Sync Core
│   ├── auth/                      # Google OAuth 2.0 InstalledAppFlow & token lifecycle
│   ├── crypto/                    # BIP-39 recovery, Argon2id KDF, SecretStream envelopes
│   ├── storage/                   # StorageAdapter interface, GoogleDriveStorageAdapter
│   ├── sync/                      # Version manifests, PushEngine, PullEngine, StatusEngine
│   ├── workspace/                 # SWH1 header, catalog, WAL SQLite metadata engine
│   ├── api.py                     # Unified JSON-RPC API facade
│   └── daemon.py                  # Headless NDJSON IPC sidecar daemon
├── apps/
│   ├── desktop/                   # Native Windows Desktop App (Tauri v2 + React 19 + TypeScript)
│   │   ├── src/                   # React views: Wizard, Dashboard, File Explorer, Sync
│   │   └── src-tauri/             # Rust shell & Python sidecar manager
│   └── web/                       # Cloudflare Pages Web App & In-Browser Viewer
│       ├── src/crypto/            # WASM Argon2id worker, pure-TS BIP-39 parser, XChaCha20
│       ├── src/drive/             # Google Identity Services (GIS) & Drive API client
│       ├── src/components/        # Landing page, Workspace selector, Document viewers
│       └── public/                # Branding assets, icons, security headers
├── branding/                      # Official brand assets (Windows icon.ico, SVG marks & logos)
├── specs/                         # Cryptographic specification & published test_vectors.json
└── scripts/
    ├── build_desktop.ps1          # Clean build script for standalone Windows desktop installers
    └── bundle_daemon.py           # PyInstaller bundler for headless Python daemon sidecar
```

---

## Building from Source

### Prerequisites
- Node.js 22+ & npm
- Python 3.12+ (in virtualenv `.venv`)
- Rust toolchain (`cargo`, `rustc`) for Tauri desktop builds

### 1. Build the Desktop App & Windows Installers
Run the automated clean build script (cleans stale caches, re-bundles the Python daemon fresh from source, and compiles the Tauri installers):
```powershell
.\scripts\build_desktop.ps1
```
Output installers will be placed in:
- Setup executable: `apps/desktop/src-tauri/target/release/bundle/nsis/SecureWorkspace_0.1.0_x64-setup.exe`
- MSI installer: `apps/desktop/src-tauri/target/release/bundle/msi/SecureWorkspace_0.1.0_x64_en-US.msi`

### 2. Build the Web App
```powershell
cd apps/web
npm install
npm run build
```
Output static assets will be in `apps/web/dist/`.

### 3. Run Automated Tests
```powershell
# Python Core & Cryptographic Parity Tests (19 tests)
.venv\Scripts\pytest tests/unit -v

# Web App WASM Crypto Parity Tests (5 tests)
npm --prefix apps/web test
```

---

## Deployment & Production Hosting

The web app is deployed on **Cloudflare Pages / Workers**:

- **Domain:** `https://secureworkspace.harshdadiya.in`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Root Directory:** `apps/web`

### Google Cloud OAuth Configuration
For production deployments, the domain must be whitelisted in [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
1. Under your **OAuth 2.0 Web Client ID**, add your domain to **Authorized JavaScript origins**:
   - `https://secureworkspace.harshdadiya.in`
2. Since the app only requests the least-privilege `https://www.googleapis.com/auth/drive.file` scope, users authorize access only to files created by SecureWorkspace.

---

## Implementation Status

- [x] **Phase 0: Architecture Spikes** (Argon2id + SecretStream, cross-platform decryption).
- [x] **Phase 1: Core Cryptography** (Fixed 246-byte `SWH1` header, 64 KB `SWF1` SecretStream, dual-path key wrapping, BIP-39 recovery).
- [x] **Phase 2: Storage Layer** (Resumable Google Drive uploads, retry backoff, multi-workspace subfolder isolation).
- [x] **Phase 3: SQLite Metadata Engine** (WAL mode SQLite, encrypted paths at rest with keyed BLAKE2b digests, change detector).
- [x] **Phase 4: Git-Style Sync Engine** (Push with atomic HEAD checks, non-destructive pull with safety snapshots, historical rollbacks).
- [x] **Phase 5: Desktop Application** (Tauri v2 + React 19, official branding overhaul, Windows installer packaging).
- [x] **Phase 6: Web App & Zero-Server Viewer** (Product landing page, Google Identity Services OAuth, Web Worker WASM decryption, Word/Excel/PDF/CSV viewers, Cloudflare custom domain).
- [ ] **Phase 7: Mobile App** (Android with embedded Chaquopy Python core).
- [ ] **Phase 8: Offline Backups** (Encrypted external drive export and recovery drills).

---

## Security & Verification

All cryptographic operations strictly adhere to [specs/encryption-format/spec.md](specs/encryption-format/spec.md) and verify bit-for-bit against [specs/encryption-format/test_vectors.json](specs/encryption-format/test_vectors.json).

*Note: SecureWorkspace is open-source software under active development. Ensure you retain your 24-word recovery phrase in a secure offline location.*
