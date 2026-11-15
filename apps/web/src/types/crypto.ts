export interface Argon2Params {
  memorySize: number; // in KiB (e.g. 65536 for 64MB)
  iterations: number; // e.g. 3
  parallelism: number; // e.g. 1
  hashLength: number; // 32 bytes (256-bit KEK)
}

export interface WorkspaceHeader {
  magic: string; // 'SWH1'
  version: number; // 1
  workspaceId: Uint8Array; // 16 bytes UUID
  opslimit: number; // uint32
  memlimit: number; // uint32
  passwordSalt: Uint8Array; // 16 bytes
  recoverySalt: Uint8Array; // 16 bytes
  passwordNonce: Uint8Array; // 24 bytes
  wrappedWmkPassword: Uint8Array; // 48 bytes (32B key + 16B Poly1305 MAC)
  recoveryNonce: Uint8Array; // 24 bytes
  wrappedWmkRecovery: Uint8Array; // 48 bytes
  createdAtMs: number; // int64
  name: string; // up to 32 chars
}

export interface DecryptedManifestEntry {
  path: string;
  file_id_hex: string;
  size: number;
  sha256: string;
  mtime_ms: number;
}

export interface VersionManifestData {
  format: string;
  version_number: number;
  manifest_id: string;
  timestamp_ms: number;
  device_id: string;
  message: string;
  entries: DecryptedManifestEntry[];
}
