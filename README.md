# SecureWorkspace

Open-source, client-side encrypted backup and sync. Files are encrypted on your device before upload, so Google Drive only ever stores ciphertext. You keep the keys, the storage account, the version history and the recovery material.

> **Status: early development (Phase 0, validation spikes).**
> Not security-reviewed. Do not put real personal documents in it yet.

## What it will do

- Create an encrypted workspace with a master password and a recovery key.
- Store encrypted files in a single folder in your own Google Drive.
- Work like git: **Pull** (make this device match Drive), **Push** (send local changes as a new version), **Revert** (go back to an earlier Drive version).
- Keep 90 days of encrypted version history.
- Make separate snapshots to an external hard drive that restore without Drive.
- Run on Windows, Ubuntu and Android, using one shared Python core.

## How it is built

- **Core (Python):** all crypto, sync, history and recovery live in one package, `secureworkspace-core`. Crypto uses libsodium through PyNaCl (XChaCha20-Poly1305, Argon2id). No custom algorithms.
- **Desktop:** PySide6 app that imports the core directly.
- **Android:** React Native UI. The same Python core runs inside the app through Chaquopy. Whether this works is the first thing Phase 0 checks.
- **Storage:** Google Drive, `drive.file` permission only. The app creates one folder and never touches anything outside it.
- **Identity:** your Google account. No SecureWorkspace account and no server.

## Repo layout

```text
core/secureworkspace_core/   Python core (crypto, workspace, storage, sync, history, recovery)
apps/desktop/                PySide6 app
apps/android/                React Native app + Chaquopy + Kotlin bridge
specs/                       File format, metadata, sync protocol, recovery format, test vectors
spikes/                      Phase 0 throwaway experiments and findings
tests/                       unit, integration, vectors
docs/                        architecture, security, recovery, user guide
```

## Dev setup

Needs Python 3.10 or newer and Git.

```bash
git clone https://github.com/<your-username>/secureworkspace.git
cd secureworkspace
python -m venv .venv
source .venv/bin/activate        # Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -e "core[dev]"
pytest
```

## Roadmap

Phases are in order, each ends with something testable.

0. Validation spikes (crypto on desktop, Chaquopy on Android, React Native bridge, Drive access)
1. Core encryption library and file format spec
2. Google Drive storage adapter
3. Workspace and local metadata
4. Pull, Push and Revert
5. Desktop app
6. Android app
7. History and external backups
8. Security hardening, independent review, release

## Security notes

- Client-side encryption hides file contents, not everything. Drive can still see file sizes, timing and your account.
- Files are plaintext while open on your device. Malware or a compromised unlocked device can read them.
- If you lose both the master password and the recovery key, your data cannot be recovered by anyone.
- No independent security review has been done yet.

Found a security problem? Please open a private security advisory on GitHub instead of a public issue.

## License

To be decided before the first public release.

## Contributing

Not open for outside contributions yet while the architecture is being validated. Issues and ideas are welcome.