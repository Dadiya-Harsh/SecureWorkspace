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
  PushPreviewData,
  PullPreviewData,
  RemoteVersion,
  FileHistoryVersion,
  SafetySnapshotItem,
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
    const res = await this.dispatch<{ files: any[] }>("list_files", { subpath });
    if (!res.success || !res.data?.files) {
      return res as any;
    }

    // Adapt core FileRecord format to UI WorkspaceFile format
    const adapted: WorkspaceFile[] = res.data.files.map((f: any) => {
      const p = f.path || f.name || "";
      const name = p.split("/").pop() || p;
      const size_bytes = f.size ?? f.size_bytes ?? 0;
      let modified_at = "Recently";
      if (f.mtime_ms) {
        modified_at = new Date(f.mtime_ms).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        });
      } else if (f.modified_at) {
        modified_at = f.modified_at;
      }

      let status = f.status || "synced";
      if (f.sync_status) {
        const s = String(f.sync_status).toUpperCase();
        if (s === "NEW" || s === "MODIFIED") status = "not_pushed";
        else if (s === "SYNCED") status = "synced";
        else if (s === "DELETED") status = "deleted";
      }

      return {
        name,
        path: p,
        size_bytes,
        modified_at,
        status,
      };
    });

    return {
      ...res,
      data: { files: adapted },
    };
  }

  async addFile(source_path: string, dest_rel_path: string): Promise<APIResponse<{ path: string; size: number }>> {
    return this.dispatch("add_file", { source_path, dest_rel_path });
  }

  async openFile(rel_path: string): Promise<APIResponse<{ temp_path: string; original_path: string }>> {
    return this.dispatch("open_file", { rel_path });
  }

  async saveFile(rel_path: string, edited_source_path: string): Promise<APIResponse<{ path: string; size: number }>> {
    return this.dispatch("save_file", { rel_path, edited_source_path });
  }

  async deleteFile(rel_path: string): Promise<APIResponse<{ path: string; deleted: boolean }>> {
    return this.dispatch("delete_file", { rel_path });
  }

  async pushPreview(): Promise<APIResponse<PushPreviewData>> {
    return this.dispatch("push_preview");
  }

  async push(
    message: string = "",
    confirm_mass_deletion: boolean = false,
    device_id: string = "desktop"
  ): Promise<APIResponse<{ new_version: number; files_uploaded: number }>> {
    return this.dispatch("push", { message, confirm_mass_deletion, device_id });
  }

  async forcePush(
    message: string = "Force push",
    confirm: boolean = true,
    device_id: string = "desktop"
  ): Promise<APIResponse<{ new_version: number; files_uploaded: number }>> {
    return this.dispatch("force_push", { message, confirm, device_id });
  }

  async pullPreview(): Promise<APIResponse<PullPreviewData>> {
    return this.dispatch("pull_preview");
  }

  async pull(confirm: boolean = true): Promise<APIResponse<{ pulled_version: number }>> {
    return this.dispatch("pull", { confirm });
  }

  async listRemoteVersions(): Promise<APIResponse<{ versions: RemoteVersion[] }>> {
    return this.dispatch("list_remote_versions");
  }

  async revertWorkspace(version_number: number, confirm: boolean = true): Promise<APIResponse<any>> {
    return this.dispatch("revert", { version_number, confirm });
  }

  async listFileVersions(path: string): Promise<APIResponse<{ path: string; versions: FileHistoryVersion[] }>> {
    return this.dispatch("list_versions", { path });
  }

  async restoreFileVersion(path: string, version_number: number): Promise<APIResponse<any>> {
    return this.dispatch("restore_version", { path, version_number });
  }

  async listSafetySnapshots(): Promise<APIResponse<{ snapshots: SafetySnapshotItem[] }>> {
    return this.dispatch("list_safety_snapshots");
  }

  async restoreSafetySnapshot(snapshot_id: string): Promise<APIResponse<{ snapshot_id: string; restored_path: string }>> {
    return this.dispatch("restore_safety_snapshot", { snapshot_id });
  }

  async deleteSafetySnapshot(snapshot_id: string): Promise<APIResponse<{ snapshot_id: string; deleted: boolean }>> {
    return this.dispatch("delete_safety_snapshot", { snapshot_id });
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

      case "push_preview":
        return {
          success: true,
          id,
          data: {
            base_version: 14,
            remote_head: 14,
            is_refused: false,
            refusal_reason: null,
            has_changes: true,
            is_mass_deletion: false,
            upload_count: 2,
            delete_count: 1,
            files_to_upload: [
              { relative_path: "Documents/Taxes/budget.xlsx", size_bytes: 84000, mtime_epoch: Date.now() / 1000 },
              { relative_path: "Documents/Taxes/passport-scan.pdf", size_bytes: 1450000, mtime_epoch: Date.now() / 1000 },
            ],
            files_to_delete: [
              { relative_path: "Documents/Taxes/old-notes.csv", size_bytes: 12000, mtime_epoch: Date.now() / 1000 },
            ],
          } as any,
        };

      case "push":
        return {
          success: true,
          id,
          message: "Pushed version 15 successfully.",
          data: { new_version: 15, files_uploaded: 2 } as any,
        };

      case "list_remote_versions":
        return {
          success: true,
          id,
          data: {
            versions: [
              {
                version_number: 14,
                manifest_id: "m-014",
                timestamp_ms: Date.now() - 3600000 * 2,
                device_id: "desktop-win",
                message: "Updated tax return and spreadsheet calculations",
                entries: [
                  { path: "Documents/Taxes/budget.xlsx", object_id: "obj-1", size: 84000, sha256: "abc...", mtime_ms: Date.now() },
                  { path: "Documents/Taxes/return-2025.pdf", object_id: "obj-2", size: 1200000, sha256: "def...", mtime_ms: Date.now() },
                ],
              },
              {
                version_number: 13,
                manifest_id: "m-013",
                timestamp_ms: Date.now() - 86400000 * 2,
                device_id: "mobile-android",
                message: "Added passport scan and insurance receipts",
                entries: [
                  { path: "Documents/Taxes/scan-01.jpg", object_id: "obj-3", size: 3400000, sha256: "123...", mtime_ms: Date.now() },
                ],
              },
              {
                version_number: 12,
                manifest_id: "m-012",
                timestamp_ms: Date.now() - 86400000 * 5,
                device_id: "desktop-win",
                message: "Initial workspace seed",
                entries: [],
              },
            ],
          } as any,
        };

      case "list_safety_snapshots":
        return {
          success: true,
          id,
          data: {
            snapshots: [
              {
                snapshot_id: "snap_20261114_140201",
                timestamp_ms: Date.now() - 7200000,
                original_path: "Documents/Taxes/budget.xlsx",
                original_path_hash: "hash123",
                snapshot_path: ".snapshots/snap_20261114_140201",
                size: 82000,
                sha256: "sha_prev_version",
                reason: "pre-pull",
              },
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
