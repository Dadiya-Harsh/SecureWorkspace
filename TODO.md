# SecureWorkspace — Actionable TODO & Priority Roadmap

This document outlines all roadmap items for **SecureWorkspace**, ordered by current development priority:
1. **Priority 1: Web App & Zero-Server Read-Only Viewer** (Landing page, in-browser decryption, rich file viewers, Cloudflare deployment)
2. **Priority 2: Codebase Cleanup & Hygiene** (Neutralizing dev placeholders and mock data)
3. **Priority 3: Desktop Notification System** (Global toasts across wizard, sync, backups, and security)
4. **Priority 4: Must-Have Requirements Before Desktop is Done** (Remote join from Drive, real backup daemon, settings, retention, key rotation)

---

## 1. Priority 1: Web App & Zero-Server Read-Only Viewer

*Zero-Server Invariant: The web app is a 100% client-side static Single Page Application (SPA). Decryption, key derivation, and document rendering occur purely in browser RAM (`Uint8Array`). No backend server exists.*  
*Detailed End-to-End Implementation Plan: [WEB_APP_IMPLEMENTATION_PLAN.md](file:///D:/Projects/SecureWorkspace/docs/WEB_APP_IMPLEMENTATION_PLAN.md)*

### 1.1 Project Scaffolding & Core Architecture (`apps/web/`)
- [ ] Scaffold `apps/web/` using Vite + React 19 + TypeScript (`npm create vite@latest apps/web -- --template react-ts`).
- [ ] Configure Tailwind CSS v4 with Mineral / Vault-Green design tokens matching desktop (`#14201C`, `#00C888`, `#F5F4EF`).
- [ ] Configure WebAssembly & Web Worker bundling (`vite-plugin-wasm`, `vite-plugin-top-level-await`).
- [ ] Install production dependencies:
  - Cryptography: `libsodium-wrappers-sumo`, `hash-wasm`, `bip39`
  - Document Viewers: `pdfjs-dist`, `xlsx`, `papaparse`, `docx-preview`, `marked`, `dompurify`, `prismjs`
  - State & UI: `zustand`, `lucide-react`, `react-router-dom`

### 1.2 Cryptographic WASM Engine (`src/crypto/`)
- [ ] Implement Web Worker (`crypto.worker.ts`) to execute Argon2id KDF off the main UI thread (64MB memory, 3 iterations).
- [ ] Implement `workspace.header` parser (`SWH1` magic check, salt extraction).
- [ ] Implement Master Password & 24-word BIP-39 recovery phrase unwrap to derive the Workspace Master Key (WMK).
- [ ] Implement BLAKE2b subkey derivation (`meta_key` and `file_key`).
- [ ] Implement XChaCha20-Poly1305 SecretStream 64KB chunk decryption.
- [ ] Implement memory zeroization utility (`typedArray.fill(0)`) on lock, timeout, or page unload.
- [ ] Automated verification against [test_vectors.json](file:///D:/Projects/SecureWorkspace/specs/encryption-format/test_vectors.json).

### 1.3 Google Drive v3 REST Client (`src/drive/`)
- [ ] Integrate Google Identity Services (GIS) token client using `WEB_CLIENT_ID.json`.
- [ ] Scope request to `https://www.googleapis.com/auth/drive.file` (access strictly to files created/opened by the app).
- [ ] Client-side discovery: Find `SecureWorkspace` folder in Drive root.
- [ ] Download latest `versions/*.manifest` and stream `objects/*.bin` chunks directly into memory via `alt=media`.

### 1.4 Screen 1: Product Landing Page (`src/components/landing/`)
- [ ] Build marketing hero based on mockup `Product page.png`:
  - Brand header with `Cyber Shield Vault` logo, navigation links, and `[Open web viewer]` button.
  - Headline: *"Open source, no account with us."*
  - Subtitle: *"Your files, encrypted before they reach Google Drive. Google stores ciphertext only. You keep the password and a 24-word recovery key. We run no server and hold no keys."*
  - CTA buttons: `[Download for Windows (v0.1.0)]` and `[Open web viewer]`.
- [ ] Ciphertext Showcase dual-pane visual: Contrast what Google sees (`objects/*.bin`, `versions/*.manifest`, encrypted noise) vs real vault view.
- [ ] 3-Step "How It Works" cards: (1) Create vault, (2) Push to Drive, (3) Read anywhere.
- [ ] Feature cards & Honest limits: Version history, offline backup, honest threat model, read-only web viewer.

### 1.5 Screens 2 & 3: Web Viewer Connect & Unlock (`src/components/viewer/`)
- [ ] **Step 1: Connect (`Web viewer connect.png`)**:
  - `STEP 1 OF 2` indicator.
  - `[Continue with Google]` GIS OAuth button.
  - Security advisory explaining `drive.file` scope and zero-server privacy.
- [ ] **Step 2: Unlock (`Web viewer unlock.png`)**:
  - `STEP 2 OF 2` indicator with connected Google user badge.
  - Workspace title & version badge (*"Version 14, pushed from Desktop"*).
  - Master Password input with reveal toggle + `[Unlock Vault]` button.
  - Toggle: *"Use 24-word recovery phrase instead"* (reveals BIP-39 mnemonic input).
  - Security advisory regarding browser-based Argon2id derivation.

### 1.6 Screen 4: Vault File Browser (`src/components/viewer/FileTable.tsx`)
- [ ] Top warning banner: *"Read-only view. To change files, use the desktop app."*
- [ ] Header toolbar with auto-lock timer (`Auto-locks in 09:40`) and instant `[Lock Now]` button.
- [ ] Folder breadcrumb navigation (`Documents / Accounts`).
- [ ] File explorer table: columns for Name, Size, and Modified Date.
- [ ] Extension-specific icons (PDF, Excel, Word, Code, CSV, Image, Markdown).

### 1.7 Screen 5: Rich In-Browser Document Viewers (`src/components/viewers/`)
- [ ] **PDF Viewer (`.pdf`)**: Mozilla `pdfjs-dist` canvas rendering with page navigation and zoom controls.
- [ ] **Excel & Spreadsheet Viewer (`.xlsx`, `.xls`, `.ods`)**: SheetJS (`xlsx`) multi-tab workbook grid with frozen top header row.
- [ ] **CSV / Delimited Viewer (`.csv`, `.tsv`)**: `papaparse` table with cell reveal/copy and search filtering.
- [ ] **Word Document Viewer (`.docx`)**: `docx-preview` DOM layout rendering.
- [ ] **Text & Code Viewer (`.txt`, `.log`, `.json`, `.yaml`, `.py`, `.ts`)**: `prismjs` syntax highlighter with line numbers.
- [ ] **Markdown Viewer (`.md`)**: `marked` + `dompurify` sanitized reading layout.
- [ ] **Image Viewer (`.png`, `.jpg`, `.jpeg`, `.svg`, `.webp`)**: Ephemeral Blob URL canvas with zoom/pan controls.
- [ ] **Unsupported Binaries**: Metadata card with SHA-256 hash and a `[Download Decrypted File]` button.
- [ ] Clipboard auto-clear after 30 seconds for copied text/cell values.

### 1.8 Cloudflare Pages Deployment & CI/CD Pipeline
- [ ] Configure Cloudflare Pages for static SPA deployment on domain `https://harshdadiya.in`.
- [ ] Configure HTTP security headers (CSP with `wasm-unsafe-eval`, COOP/COEP for WebAssembly/Web Workers).
- [ ] GitHub Actions workflow `.github/workflows/web-app-ci-cd.yml`:
  - Run linter & type-check (`tsc --noEmit`).
  - Run cryptographic test vector suite against `test_vectors.json`.
  - Build production static bundle (`apps/web/dist`).
  - Deploy to Cloudflare Pages with branch preview URLs on PRs.

---

## 2. Priority 2: Codebase Cleanup & Hygiene

### 2.1 Frontend Placeholder & Mock Neutralization
- [ ] **`apps/desktop/src/components/CreateWorkspaceWizard.tsx`**:
  - Line 47: Change initial state `useState<string>("name@gmail.com")` to empty string `useState<string>("")` to avoid flashing a dummy email before live status returns.
- [ ] **`apps/desktop/src/App.tsx`**:
  - Line 45: Change initial state `useState<string>("name@gmail.com")` to empty string `useState<string>("")`.
- [ ] **`apps/desktop/src/api/client.ts`**:
  - Lines 364 & 378: In `devMockDispatch` (browser preview mode), replace personal names and emails with neutral developer mocks:
    - Change `email: "name@gmail.com"` -> `email: "user@example.com"`
    - Change `name: "Harsh"` -> `name: "Demo User"`

### 2.2 Credential & OAuth Architecture Verification
- [x] **Git Tracking Verified**:
  - `spikes/spike_06_drive/token.json` is properly ignored by `.gitignore` (Line 25) and is **not committed**.
  - `google outh clients/` directory is properly ignored by `.gitignore` (Line 21) and is **not committed**.
- [x] **Production Token Path Clarification & Clean Fallback Removal**:
  - In production, authorized tokens are written to OS user data (`%LOCALAPPDATA%\SecureWorkspace\credentials.json`), keeping the application directory and repository completely token-free.
  - The legacy `_find_dev_fallback_token()` has been completely removed from `core/secureworkspace_core/auth/google_oauth.py`. The app strictly uses genuine OAuth login via `login()`, eliminating any risk of ghost credentials.
- [x] **BIP-39 Wordlist Validation**:
  - Line 846 in `core/secureworkspace_core/crypto/wordlist.py` contains `"harsh"`. This is **not** a personal credential; it is word #846 in the official BIP-39 English mnemonic specification. It must remain unchanged.

---

## 3. Priority 3: Desktop Notification System Implementation

Currently, toast notifications in `App.tsx` are rendered only while in the `unlocked` app state. To achieve a realistic desktop experience, notifications must be accessible across all app lifecycle states (`wizard`, `locked`, `unlocked`).

### 3.1 Toast Architecture Enhancement
- [ ] **Global Notification Provider / Context**:
  - Lift toast state or create a lightweight `ToastContext` / `useToast()` hook so any component (`CreateWorkspaceWizard`, `UnlockView`, `PushPreviewModal`, etc.) can dispatch non-blocking toast notifications.
  - Ensure the toast container sits above modals and wizard steps (`z-50`, bottom-right or top-right).
  - Support 4 semantic toast variants: `success` (green), `info` (blue/slate), `warning` (amber), and `error` (red).

### 3.2 Create Workspace Wizard (`CreateWorkspaceWizard.tsx`)
- [ ] **Step 3: Copy Recovery Phrase**:
  - Add toast on clicking "Copy":
    - **Message:** `"✓ 24-word recovery phrase copied to clipboard. Store it securely!"`
    - **Type:** `success`
- [ ] **Step 3: Save Recovery Phrase as File**:
  - Add toast on clicking "Save as file":
    - **Message:** `"✓ Recovery key saved as file: secureworkspace-recovery-${name.toLowerCase()}.txt"`
    - **Type:** `success`
- [ ] **Step 3: Print Recovery Phrase**:
  - Add toast on clicking "Print":
    - **Message:** `"🖨️ Opening print dialog for recovery key..."`
    - **Type:** `info`
    - Add error toast fallback if printing is blocked or fails: `"Print dialog could not be opened."`
- [ ] **Step 4: Recovery Test Verification**:
  - Add toast when user verifies all words correctly:
    - **Message:** `"✓ Recovery phrase verified successfully!"`
    - **Type:** `success`
- [ ] **Step 5: Connect Google Drive**:
  - Add toast when Google OAuth authorization succeeds:
    - **Message:** `"✓ Google Drive connected as ${email}. Encrypted folder ready."`
    - **Type:** `success`
  - Add error toast if OAuth is cancelled or fails:
    - **Message:** `"Google Drive authorization failed: ${errorMessage}"`
    - **Type:** `error`

### 3.3 Cloud Sync & Push Lifecycle (`PushPreviewModal.tsx` & `App.tsx`)
- [ ] **Successful Push to Google Drive**:
  - Wire `onSuccess(newVersion)` in `App.tsx` to trigger:
    - **Message:** `"✓ Successfully pushed Version ${newVersion} to Google Drive."`
    - **Type:** `success`
- [ ] **Background Remote Changes Detected**:
  - When background polling or status check detects `remote_head > base_version`:
    - **Message:** `"☁️ New updates detected on Google Drive. Click 'Pull Changes' to sync."`
    - **Type:** `info`

### 3.4 Security & Auto-Lock Lifecycle (`App.tsx` & `UnlockView.tsx`)
- [ ] **15-Minute Inactivity Auto-Lock**:
  - Show a banner or toast notification on `UnlockView` when locked by timer:
    - **Message:** `"🔒 Vault locked automatically due to 15 minutes of inactivity."`
    - **Type:** `warning`
- [ ] **Manual Vault Lock**:
  - Trigger toast upon user clicking "Lock":
    - **Message:** `"🔒 Vault locked. Encryption keys scrubbed from memory."`
    - **Type:** `info`

### 3.5 Encrypted Offline Backups (`BackupsView.tsx`)
- [ ] **External Backup Export Completion**:
  - Upgrade inline status to an app-wide floating toast:
    - **Message:** `"✓ Encrypted backup created and SHA-256 verified at: ${destinationPath}"`
    - **Type:** `success`
- [ ] **Missing Target Destination Alert**:
  - Toast when clicking export without selecting a destination folder:
    - **Message:** `"Please select a folder on your external drive first."`
    - **Type:** `error`

### 3.6 History & Disaster Recovery (`HistoryView.tsx`)
- [ ] **Workspace Rollback**:
  - Trigger global toast when rolling back to a previous version:
    - **Message:** `"✓ Workspace rolled back to Version ${version}. Safety snapshot saved."`
    - **Type:** `success`
- [ ] **Single File Restoration**:
  - Trigger global toast when restoring a file from a past version:
    - **Message:** `"✓ Restored '${filePath}' from Version ${version}."`
    - **Type:** `success`
- [ ] **Safety Snapshot Deletion**:
  - Trigger global toast when deleting a pre-pull safety snapshot:
    - **Message:** `"✓ Safety snapshot deleted."`
    - **Type:** `info`

### 3.7 Settings & Google Drive Account (`App.tsx`)
- [ ] **Google Drive Connect / Disconnect in Settings**:
  - Upgrade inline label to toast notifications:
    - **Connect:** `"✓ Google Drive connected as ${email}."` (`success`)
    - **Disconnect:** `"Google Drive disconnected."` (`info`)

---

## 4. Priority 4: Must-Have Requirements Before Desktop is Done

### 4.1 Join from Drive on a New Device (Remote Setup Flow)
- [ ] **Remote Vault Discovery & Clone Flow**:
  - Currently, "Open existing" only picks a folder that already exists on the local filesystem.
  - Implement a **"Join from Google Drive"** onboarding path on `WelcomeOnboardingView`:
    1. Authenticate with Google Drive.
    2. Discover existing remote workspaces stored in the user's `SecureWorkspace` cloud folder.
    3. Choose a local destination directory on the new machine.
    4. Prompt for the Master Password or 24-word BIP-39 recovery phrase to decrypt the remote header.
    5. Clone and pull the latest version into the local working directory.

### 4.2 Real External Backup Engine
- [ ] **Backup Methods in Daemon API Table**:
  - Implement real daemon methods:
    - `backup_export(workspace_id, destination_dir)` -> creates timestamped encrypted tarball/folder with SHA-256 manifest.
    - `backup_verify(backup_path)` -> validates integrity of an external backup without restoring it.
    - `backup_restore(backup_path, destination_dir, recovery_phrase)` -> restores vault to disk.
- [ ] **Welcome Screen "Recover from Backup" Flow**:
  - Add "Recover from Backup" on the initial welcome screen for users restoring on a fresh computer without Google Drive.
- [ ] **Automated Backup Reminders**:
  - Amber badge at 7 days since last backup.
  - Red alert badge at 30 days since last backup.

### 4.3 Settings Panel Expansion (`SettingsView.tsx`)
- [ ] **Security Settings**:
  - Change master password (re-wraps WMK with new password salt and derived KEK).
  - View / regenerate 24-word recovery phrase.
  - Configurable auto-lock timeout (5m, 15m, 30m, 1h, Never).
- [ ] **Maintenance Settings**:
  - History retention policy (30 days, 90 days, 1 year, Forever).
  - Export diagnostic logs (sanitized log package).

### 4.4 Deleted Files & Retention Engine
- [ ] **Deleted Files Tab / View**:
  - Add a "Trash / Deleted Files" view showing tombstoned files from past manifests.
  - Single-click "Restore File" button restoring the file to the current working tree.
- [ ] **90-Day History Cleanup Engine**:
  - Automatically flag or purge file tombstones older than 90 days from the catalog.
- [ ] **Permanent Delete (Secure Purge)**:
  - Add ability to permanently purge deleted files, removing their ciphertext blobs from Google Drive.

### 4.5 Lost Device & Key Rotation Protocol
- [ ] **Workspace Master Key (WMK) Rotation**:
  - When a device is lost or stolen, provide a guided **"Rotate Workspace Master Key"** workflow.
  - Generates a new 256-bit WMK, re-encrypts all file payload ciphertext blocks, updates the cloud header, and revokes access for the lost device's old subkeys.
- [ ] **"Lost a Device" Guided Checklist**:
  - In-app security guide: Steps to revoke Google OAuth access for the lost machine, trigger WMK rotation, and verify active synchronized devices.

### 4.6 Plaintext Decision & Cryptographic Positioning
- [ ] **Confirm Working Folder Plaintext Model**:
  - Clarify the architectural reality:
    - *Current implementation:* The local working folder contains decrypted files while the vault is unlocked so standard desktop applications can edit files natively. Files are encrypted on disk at rest when locked/backed up, and end-to-end encrypted before syncing to Google Drive.
  - **Resolution Steps**:
    1. Confirm if a virtual mounted filesystem (e.g. Dokany/WinFsp driver) is planned, OR if the application uses the standard user directory sync model.
    2. Align all UI and documentation copy: Clarify the difference between *"Zero-Knowledge E2EE in cloud and at rest when locked"* vs *"Working directory unencrypted while vault is active for native file editing"*. Remove any misleading "zero plaintext on disk while unlocked" claims.
