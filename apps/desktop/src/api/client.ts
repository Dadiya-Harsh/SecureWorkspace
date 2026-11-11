/**
 * API Client Bridge for SecureWorkspace.
 * Provides transparent communication with the Python Sidecar Daemon.
 * Falls back to demo state when running in browser dev mode for rapid UI preview.
 */

import {
  APIResponse,
  CreateWorkspaceResult,
  GoogleAuthStatusData,
  SyncStatusData,
  WorkspaceFile,
} from "./types";

class SecureWorkspaceClient {
  private isTauriAvailable = false;
  private reqCounter = 0;

  constructor() {
    // Check if running inside Tauri window
    this.isTauriAvailable = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
  }

  private nextId(): string {
    return `req-${++this.reqCounter}`;
  }

  /**
   * Generic dispatch method matching core/secureworkspace_core/daemon.py protocol.
   */
  async dispatch<T>(method: string, params: Record<string, any> = {}): Promise<APIResponse<T>> {
    const id = this.nextId();
    const payload = { id, method, params };

    if (this.isTauriAvailable) {
      try {
        // Dynamic import Tauri invoke if available
        const { invoke } = await import("@tauri-apps/api/core");
        return await invoke<APIResponse<T>>("dispatch_daemon", { request: payload });
      } catch (err: any) {
        console.warn(`[API] Tauri IPC error for ${method}:`, err);
        return {
          success: false,
          error_code: "INTERNAL_ERROR",
          message: err?.message || String(err),
          id,
        };
      }
    }

    // Dev preview fallback (browser mode)
    return this.devMockDispatch<T>(method, params, id);
  }

  // --- High-level Typed API Methods ---

  async isUnlocked(): Promise<APIResponse<{ is_unlocked: boolean; name?: string; workspace_path?: string }>> {
    return this.dispatch("is_unlocked");
  }

  async createWorkspace(workspace_path: string, name: string, password: string): Promise<APIResponse<CreateWorkspaceResult>> {
    return this.dispatch("workspace_create", { workspace_path, name, password });
  }

  async verifyRecoveryTest(recovery_phrase: string): Promise<APIResponse<{ verified: boolean }>> {
    return this.dispatch("verify_recovery_test", { recovery_phrase });
  }

  async unlock(workspace_path: string, password_or_recovery_key: string): Promise<APIResponse<{ workspace_id: string; name: string }>> {
    return this.dispatch("workspace_unlock", { workspace_path, password_or_recovery_key });
  }

  async lock(): Promise<APIResponse<{ locked: boolean }>> {
    return this.dispatch("workspace_lock");
  }

  async getStatus(quick: boolean = false): Promise<APIResponse<SyncStatusData>> {
    return this.dispatch("status", { quick });
  }

  async listFiles(subpath: string = ""): Promise<APIResponse<{ files: WorkspaceFile[] }>> {
    return this.dispatch("list_files", { subpath });
  }

  async push(message: string = ""): Promise<APIResponse<{ new_version: number; objects_uploaded: number }>> {
    return this.dispatch("push", { message });
  }

  async pull(confirm: boolean = true): Promise<APIResponse<{ pulled_version: number }>> {
    return this.dispatch("pull", { confirm });
  }

  async googleAuthStatus(auto_connect: boolean = true): Promise<APIResponse<GoogleAuthStatusData>> {
    return this.dispatch("google_auth_status", { auto_connect });
  }

  async googleAuthLogin(port: number = 0): Promise<APIResponse<GoogleAuthStatusData>> {
    return this.dispatch("google_auth_login", { port });
  }

  async googleAuthLogout(): Promise<APIResponse<{ authenticated: boolean; storage_connected: boolean }>> {
    return this.dispatch("google_auth_logout");
  }

  // --- Browser Dev Mock Provider ---
  private async devMockDispatch<T>(method: string, params: Record<string, any>, id: string): Promise<APIResponse<T>> {
    // Artificial latency for authentic UI feel
    await new Promise((r) => setTimeout(r, 120));

    switch (method) {
      case "is_unlocked":
        return {
          success: true,
          id,
          data: { is_unlocked: true, name: "Personal", workspace_path: "D:/SecureWorkspaces/Personal" } as any,
        };

      case "status":
        return {
          success: true,
          id,
          data: {
            base_version: 14,
            remote_head: 14,
            versions_ahead: 0,
            has_local_changes: true,
            is_diverged: false,
            is_up_to_date: false,
            changes: {
              new: [{ relative_path: "passport-scan.pdf", size_bytes: 1450000, mtime_epoch: Date.now() / 1000 }],
              modified: [{ relative_path: "budget.xlsx", size_bytes: 84000, mtime_epoch: Date.now() / 1000 }],
              deleted: [{ relative_path: "old-notes.csv", size_bytes: 12000, mtime_epoch: Date.now() / 1000 }],
              synced_count: 142,
            },
          } as any,
        };

      case "list_files":
        return {
          success: true,
          id,
          data: {
            files: [
              { name: "budget.xlsx", path: "Documents/Taxes/budget.xlsx", size_bytes: 84000, modified_at: "Today", status: "not_pushed" },
              { name: "return-2025.pdf", path: "Documents/Taxes/return-2025.pdf", size_bytes: 1200000, modified_at: "Mar 3", status: "synced" },
              { name: "receipts.csv", path: "Documents/Taxes/receipts.csv", size_bytes: 12000, modified_at: "Feb 11", status: "cloud_only" },
              { name: "scan-01.jpg", path: "Documents/Taxes/scan-01.jpg", size_bytes: 3400000, modified_at: "Feb 2", status: "changed_in_both" },
            ],
          } as any,
        };

      case "workspace_lock":
        return { success: true, id, data: { locked: true } as any };

      case "google_auth_status":
        return {
          success: true,
          id,
          data: {
            authenticated: true,
            email: "name@gmail.com",
            name: "Harsh",
            picture: "",
            storage_connected: true,
          } as any,
        };

      case "google_auth_login":
        return {
          success: true,
          id,
          message: "Google Drive authenticated successfully.",
          data: {
            authenticated: true,
            email: "name@gmail.com",
            name: "Harsh",
            picture: "",
            storage_connected: true,
          } as any,
        };

      case "google_auth_logout":
        return {
          success: true,
          id,
          data: { authenticated: false, storage_connected: false } as any,
        };

      default:
        return { success: true, id, data: { mock: true, method, params } as any };
    }
  }
}

export const api = new SecureWorkspaceClient();
