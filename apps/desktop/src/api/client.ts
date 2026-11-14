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

  async pull(confirm: boolean = true, strategy: string = "merge"): Promise<APIResponse<{ pulled_version: number }>> {
    return this.dispatch("pull", { confirm, strategy });
  }

  async hardReset(confirm: boolean = true): Promise<APIResponse<{ pulled_version: number }>> {
    return this.dispatch("hard_reset", { confirm });
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
  private async devMockDispatch<T>(method: string, _params: Record<string, any>, id: string): Promise<APIResponse<T>> {
    await new Promise((r) => setTimeout(r, 120));

    switch (method) {
      case "is_unlocked":
        return {
          success: true,
          id,
          data: { is_unlocked: false, name: "", workspace_path: "" } as any,
        };

      case "status":
        return {
          success: true,
          id,
          data: {
            base_version: 0,
            remote_head: 0,
            versions_ahead: 0,
            has_local_changes: false,
            is_diverged: false,
            is_up_to_date: true,
            changes: {
              new: [],
              modified: [],
              deleted: [],
              synced_count: 0,
            },
          } as any,
        };

      case "list_files":
        return {
          success: true,
          id,
          data: {
            files: [],
          } as any,
        };

      case "push_preview":
        return {
          success: true,
          id,
          data: {
            base_version: 0,
            remote_head: 0,
            is_refused: false,
            refusal_reason: null,
            has_changes: false,
            is_mass_deletion: false,
            upload_count: 0,
            delete_count: 0,
            files_to_upload: [],
            files_to_delete: [],
          } as any,
        };

      case "push":
        return {
          success: true,
          id,
          message: "Pushed successfully.",
          data: { new_version: 1, files_uploaded: 0 } as any,
        };

      case "pull":
        return {
          success: true,
          id,
          message: "Pulled successfully.",
          data: { pulled_version: 1 } as any,
        };

      case "hard_reset":
        return {
          success: true,
          id,
          message: "Hard reset successfully.",
          data: { pulled_version: 1 } as any,
        };

      case "list_remote_versions":
        return {
          success: true,
          id,
          data: {
            versions: [],
          } as any,
        };

      case "list_safety_snapshots":
        return {
          success: true,
          id,
          data: {
            snapshots: [],
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

      case "workspace_unlock":
        return {
          success: false,
          error_code: "WRONG_PASSWORD",
          message: "Incorrect master password or recovery phrase.",
          id,
        };

      case "google_auth_logout":
        return {
          success: true,
          id,
          data: { authenticated: false, storage_connected: false } as any,
        };

      default:
        return {
          success: false,
          error_code: "NOT_SUPPORTED",
          message: `Method ${method} is not supported in mock mode.`,
          id,
        };
    }
  }
}

export const api = new SecureWorkspaceClient();
