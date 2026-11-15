# SecureWorkspace Web App & Client-Side Viewer

This directory contains the production web application and client-side document viewer for **SecureWorkspace**, deployed live at [https://secureworkspace.harshdadiya.in](https://secureworkspace.harshdadiya.in).

## Key Architecture

- **No Server Stores Your Data / Zero Custody:** Operates 100% in the user's browser. No private keys, passwords, or decrypted document plaintext ever leave the user's device RAM.
- **Client-Side Cryptography:** Argon2id Key Derivation Function (KDF) and XChaCha20-Poly1305 multi-chunk SecretStream (`SWF1`) decryption run inside an isolated Web Worker via WebAssembly (`libsodium-wrappers-sumo` & `hash-wasm`).
- **Google Identity Services (GIS):** Connects to Google Drive using the least-privilege `drive.file` scope. Only accesses workspaces and files created by SecureWorkspace.
- **Multi-Workspace Selector:** Auto-discovers all workspaces under `SecureWorkspace/<WorkspaceName>/` in Google Drive, letting users switch between personal and business vaults seamlessly.
- **Embedded Document Viewers:**
  - Word Documents (`.docx`) via `docx-preview`
  - Excel Spreadsheets (`.xlsx`, `.xls`) via `xlsx`
  - PDF Documents (`.pdf`) via custom embed & SVG rendering
  - CSV & Delimited Data (`.csv`) via interactive table view
  - Code & Config (`.ts`, `.py`, `.json`, `.js`) with syntax rendering
  - Markdown Notes (`.md`) with GFM tables and alerts
  - Images (`.png`, `.jpg`, `.jpeg`) with in-memory blob URLs

## Development

```bash
# Install dependencies
npm install

# Start local development server (http://localhost:5173)
npm run dev

# Run cryptographic parity test vectors against published spec
npm test

# Build production bundle for Cloudflare Pages / Workers
npm run build
```

## Cloudflare Deployment

- **Framework preset:** `Vite`
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Custom Domain:** `secureworkspace.harshdadiya.in`
