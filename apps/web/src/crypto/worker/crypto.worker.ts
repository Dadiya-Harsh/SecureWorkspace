import {
  parseWorkspaceHeader,
  unwrapWmkWithPassword,
  unwrapWmkWithRecoveryPhrase,
  decryptManifest,
  decryptFileObject,
} from '../envelope';
import { getSodium } from '../kdf';
import { wipeBuffer } from '../memory';
import type { WorkerRequest, WorkerResponse } from './worker-messages';

// Ephemeral in-worker memory storage for Workspace Master Key
let cachedWmk: Uint8Array | null = null;

function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.trim().replace(/^0x/i, '');
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data;
  const { id, action } = msg;

  try {
    switch (action) {
      case 'UNLOCK_PASSWORD': {
        const header = parseWorkspaceHeader(msg.headerBytes);
        const wmk = await unwrapWmkWithPassword(header, msg.password);

        // Wipe previous key if any
        if (cachedWmk) {
          wipeBuffer(cachedWmk);
        }
        cachedWmk = wmk;

        const response: WorkerResponse = {
          id,
          action,
          success: true,
          workspaceName: header.name,
          workspaceIdHex: bytesToHex(header.workspaceId),
        };
        self.postMessage(response);
        break;
      }

      case 'UNLOCK_RECOVERY': {
        const header = parseWorkspaceHeader(msg.headerBytes);
        const wmk = await unwrapWmkWithRecoveryPhrase(header, msg.phrase);

        if (cachedWmk) {
          wipeBuffer(cachedWmk);
        }
        cachedWmk = wmk;

        const response: WorkerResponse = {
          id,
          action,
          success: true,
          workspaceName: header.name,
          workspaceIdHex: bytesToHex(header.workspaceId),
        };
        self.postMessage(response);
        break;
      }

      case 'DECRYPT_MANIFEST': {
        if (!cachedWmk) {
          throw new Error('Vault is locked. Cannot decrypt manifest.');
        }

        const manifest = await decryptManifest(msg.ciphertext, cachedWmk);
        const response: WorkerResponse = {
          id,
          action,
          success: true,
          manifest,
        };
        self.postMessage(response);
        break;
      }

      case 'DECRYPT_FILE': {
        if (!cachedWmk) {
          throw new Error('Vault is locked. Cannot decrypt file.');
        }

        const fileIdBytes = hexToBytes(msg.fileIdHex);
        const plaintext = await decryptFileObject(msg.ciphertext, cachedWmk, fileIdBytes);

        // Compute SHA-256 of decrypted plaintext for integrity verification
        const s = await getSodium();
        const sha256Bytes = s.crypto_hash_sha256(plaintext);
        const sha256Hex = bytesToHex(sha256Bytes);

        const response: WorkerResponse = {
          id,
          action,
          success: true,
          plaintext,
          sha256Hex,
        };
        // Transfer plaintext buffer ownership to eliminate in-worker duplication
        (postMessage as (message: unknown, transfer: Transferable[]) => void)(response, [plaintext.buffer]);
        break;
      }

      case 'LOCK_VAULT': {
        if (cachedWmk) {
          wipeBuffer(cachedWmk);
          cachedWmk = null;
        }

        const response: WorkerResponse = {
          id,
          action,
          success: true,
        };
        self.postMessage(response);
        break;
      }

      default:
        throw new Error(`Unknown worker action: ${(msg as WorkerRequest).action}`);
    }
  } catch (err) {
    const response: WorkerResponse = {
      id,
      action: msg.action,
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
    self.postMessage(response);
  }
};
