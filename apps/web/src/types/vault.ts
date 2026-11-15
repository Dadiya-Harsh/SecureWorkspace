export interface VaultNode {
  id: string; // relative path or folder path
  name: string; // filename or folder name
  path: string; // full relative path
  isFolder: boolean;
  size?: number; // bytes
  sha256?: string;
  mtime_ms?: number;
  file_id_hex?: string;
  children?: VaultNode[];
}

export interface ActiveFileState {
  path: string;
  name: string;
  size: number;
  sha256: string;
  mtime_ms: number;
  file_id_hex: string;
  buffer?: Uint8Array;
}
