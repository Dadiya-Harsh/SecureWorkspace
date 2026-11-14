/**
 * TypeScript API definitions for SecureWorkspace.
 * Strictly mirrors core/secureworkspace_core/api.py and PRD Section 7 JSON contracts.
 */

export enum APIErrorCode {
  INVALID_ARGUMENT = "INVALID_ARGUMENT",
  WRONG_PASSWORD = "WRONG_PASSWORD",
  ALREADY_UNLOCKED = "ALREADY_UNLOCKED",
  NOT_UNLOCKED = "NOT_UNLOCKED",
  HEADER_NOT_FOUND = "HEADER_NOT_FOUND",
  INTEGRITY_ERROR = "INTEGRITY_ERROR",
  STORAGE_NOT_CONNECTED = "STORAGE_NOT_CONNECTED",
  DRIVE_AHEAD = "DRIVE_AHEAD",
  DIVERGED = "DIVERGED",
  MASS_DELETION = "MASS_DELETION",
  CONCURRENT_PUSH = "CONCURRENT_PUSH",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
}

export interface GoogleAuthStatusData {
  authenticated: boolean;
  email?: string | null;
  name?: string | null;
  picture?: string | null;
  storage_connected: boolean;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error_code?: string;
  message?: string;
  id?: string | number;
}

export interface RegisteredWorkspace {
  id: string;
  name: string;
  path: string;
  lastOpened: number;
}

export interface WorkspaceSummary {
  workspace_id?: string;
  name?: string;
  workspace_path?: string;
  is_unlocked: boolean;
}

export interface CreateWorkspaceResult {
  workspace_id: string;
  name: string;
  recovery_phrase: string;
  workspace_path: string;
}

export interface FileChangeItem {
  relative_path: string;
  size_bytes: number;
  mtime_epoch: number;
  sha256_hex?: string;
}

export interface StatusChanges {
  new: FileChangeItem[];
  modified: FileChangeItem[];
  deleted: FileChangeItem[];
  synced_count: number;
}

export interface SyncStatusData {
  base_version: number;
  remote_head: number;
  versions_ahead: number;
  has_local_changes: boolean;
  is_diverged: boolean;
  is_up_to_date: boolean;
  changes: StatusChanges;
}

export type FileStatus = "synced" | "not_pushed" | "cloud_only" | "changed_in_both" | "added" | "deleted";

export interface WorkspaceFile {
  name: string;
  path: string;
  size_bytes: number;
  modified_at: string;
  status: FileStatus;
}

export interface PushPreviewData {
  base_version: number;
  remote_head: number;
  is_refused: boolean;
  refusal_reason?: string | null;
  has_changes: boolean;
  is_mass_deletion: boolean;
  upload_count: number;
  delete_count: number;
  files_to_upload: FileChangeItem[];
  files_to_delete: FileChangeItem[];
}

export interface PullPreviewData {
  base_version?: number;
  remote_head: number;
  is_up_to_date: boolean;
  download_count: number;
  delete_count: number;
  snapshot_count: number;
  conflict_count?: number;
  has_conflicts?: boolean;
  conflicting_files?: string[];
  files_to_download: any[];
  files_to_delete: string[];
  files_to_snapshot: string[];
}

export interface VersionManifestEntry {
  path: string;
  object_id: string;
  size: number;
  sha256: string;
  mtime_ms: number;
}

export interface RemoteVersion {
  version_number: number;
  manifest_id: string;
  timestamp_ms: number;
  device_id: string;
  message: string;
  entries?: VersionManifestEntry[];
}

export interface FileHistoryVersion {
  version_number: number;
  timestamp_ms: number;
  device_id: string;
  message: string;
  size: number;
  sha256: string;
}

export interface SafetySnapshotItem {
  snapshot_id: string;
  timestamp_ms: number;
  original_path: string;
  original_path_hash: string;
  snapshot_path: string;
  size: number;
  sha256: string;
  reason: string;
}
