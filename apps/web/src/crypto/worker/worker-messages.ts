import type { VersionManifestData } from '../../types/crypto';

export type WorkerPayload =
  | {
      action: 'UNLOCK_PASSWORD';
      headerBytes: Uint8Array;
      password: string;
    }
  | {
      action: 'UNLOCK_RECOVERY';
      headerBytes: Uint8Array;
      phrase: string;
    }
  | {
      action: 'DECRYPT_MANIFEST';
      ciphertext: Uint8Array;
    }
  | {
      action: 'DECRYPT_FILE';
      ciphertext: Uint8Array;
      fileIdHex: string;
    }
  | {
      action: 'LOCK_VAULT';
    };

export type WorkerRequest = WorkerPayload & { id: string };

export type WorkerResponse =
  | {
      id: string;
      action: 'UNLOCK_PASSWORD' | 'UNLOCK_RECOVERY';
      success: true;
      workspaceName: string;
      workspaceIdHex: string;
    }
  | {
      id: string;
      action: 'DECRYPT_MANIFEST';
      success: true;
      manifest: VersionManifestData;
    }
  | {
      id: string;
      action: 'DECRYPT_FILE';
      success: true;
      plaintext: Uint8Array;
      sha256Hex: string;
    }
  | {
      id: string;
      action: 'LOCK_VAULT';
      success: true;
    }
  | {
      id: string;
      action: string;
      success: false;
      error: string;
    };
