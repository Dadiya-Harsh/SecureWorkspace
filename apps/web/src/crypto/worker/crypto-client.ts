import type { WorkerRequest, WorkerPayload, WorkerResponse } from './worker-messages';
import type { VersionManifestData } from '../../types/crypto';

class CryptoWorkerClient {
  private worker: Worker | null = null;
  private pending = new Map<
    string,
    {
      resolve: (value: unknown) => void;
      reject: (reason: unknown) => void;
    }
  >();

  private getWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(
        new URL('./crypto.worker.ts', import.meta.url),
        { type: 'module' }
      );
      this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const res = e.data;
        const entry = this.pending.get(res.id);
        if (entry) {
          this.pending.delete(res.id);
          if (res.success) {
            entry.resolve(res);
          } else {
            entry.reject(new Error(res.error));
          }
        }
      };
      this.worker.onerror = (err) => {
        console.error('Crypto worker error:', err);
      };
    }
    return this.worker;
  }

  private postRequest<T extends WorkerResponse>(
    req: WorkerPayload,
    transfer?: Transferable[]
  ): Promise<T> {
    const worker = this.getWorker();
    const id = Math.random().toString(36).substring(2, 12);
    const fullReq = { ...req, id } as WorkerRequest;

    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, {
        resolve: resolve as (val: unknown) => void,
        reject,
      });
      if (transfer && transfer.length > 0) {
        worker.postMessage(fullReq, transfer);
      } else {
        worker.postMessage(fullReq);
      }
    });
  }

  async unlockWithPassword(
    headerBytes: Uint8Array,
    password: string
  ): Promise<{ workspaceName: string; workspaceIdHex: string }> {
    const res = await this.postRequest<
      Extract<WorkerResponse, { action: 'UNLOCK_PASSWORD' | 'UNLOCK_RECOVERY'; success: true }>
    >({
      action: 'UNLOCK_PASSWORD',
      headerBytes,
      password,
    });
    return {
      workspaceName: res.workspaceName,
      workspaceIdHex: res.workspaceIdHex,
    };
  }

  async unlockWithRecoveryPhrase(
    headerBytes: Uint8Array,
    phrase: string
  ): Promise<{ workspaceName: string; workspaceIdHex: string }> {
    const res = await this.postRequest<
      Extract<WorkerResponse, { action: 'UNLOCK_PASSWORD' | 'UNLOCK_RECOVERY'; success: true }>
    >({
      action: 'UNLOCK_RECOVERY',
      headerBytes,
      phrase,
    });
    return {
      workspaceName: res.workspaceName,
      workspaceIdHex: res.workspaceIdHex,
    };
  }

  async decryptManifest(ciphertext: Uint8Array): Promise<VersionManifestData> {
    const res = await this.postRequest<
      Extract<WorkerResponse, { action: 'DECRYPT_MANIFEST'; success: true }>
    >({
      action: 'DECRYPT_MANIFEST',
      ciphertext,
    });
    return res.manifest;
  }

  async decryptFile(
    ciphertext: Uint8Array,
    fileIdHex: string
  ): Promise<{ plaintext: Uint8Array; sha256Hex: string }> {
    const res = await this.postRequest<
      Extract<WorkerResponse, { action: 'DECRYPT_FILE'; success: true }>
    >({
      action: 'DECRYPT_FILE',
      ciphertext,
      fileIdHex,
    });
    return {
      plaintext: res.plaintext,
      sha256Hex: res.sha256Hex,
    };
  }

  async lockVault(): Promise<void> {
    await this.postRequest<
      Extract<WorkerResponse, { action: 'LOCK_VAULT'; success: true }>
    >({
      action: 'LOCK_VAULT',
    });
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pending.clear();
  }
}

export const cryptoClient = new CryptoWorkerClient();
