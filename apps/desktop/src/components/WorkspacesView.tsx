import React from "react";
import {
  Layers,
  Plus,
  FolderOpen,
  Lock,
  Unlock,
  Trash2,
  ShieldCheck,
} from "lucide-react";
import { RegisteredWorkspace } from "../api/types";

interface WorkspacesViewProps {
  workspaces: RegisteredWorkspace[];
  activeWorkspaceName: string;
  onSelectWorkspace: (ws: RegisteredWorkspace) => void;
  onCreateWorkspace: () => void;
  onOpenExistingWorkspace: () => void;
  onLockActiveWorkspace: () => void;
  onRemoveWorkspace: (ws: RegisteredWorkspace) => void;
}

export const WorkspacesView: React.FC<WorkspacesViewProps> = ({
  workspaces,
  activeWorkspaceName,
  onSelectWorkspace,
  onCreateWorkspace,
  onOpenExistingWorkspace,
  onLockActiveWorkspace,
  onRemoveWorkspace,
}) => {
  const formatDate = (ms: number) => {
    return new Date(ms).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-ink flex items-center gap-2">
            <Layers className="w-5 h-5 text-vault-green" />
            Manage Workspaces
          </h2>
          <p className="text-xs text-ink-muted mt-1 leading-relaxed">
            Configure, switch, or inspect all zero-knowledge encrypted vaults on this device.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenExistingWorkspace}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-line text-ink hover:bg-mineral transition"
          >
            <FolderOpen className="w-4 h-4 text-vault-green" />
            Open Existing Folder
          </button>
          <button
            onClick={onCreateWorkspace}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-vault-green text-white hover:bg-vault-hover transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Workspace
          </button>
        </div>
      </div>

      {/* Workspace Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {workspaces.map((ws) => {
          const isActive = ws.name === activeWorkspaceName;

          return (
            <div
              key={ws.path}
              className={`p-6 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                isActive
                  ? "bg-surface-card border-vault-green shadow-md ring-1 ring-vault-green/30"
                  : "bg-surface-card/70 border-line hover:border-line-dark/40 shadow-xs"
              }`}
            >
              <div>
                {/* Header status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isActive ? "bg-vault-green animate-pulse" : "bg-ink-muted/40"
                      }`}
                    />
                    <h3 className="font-bold text-base text-ink">{ws.name}</h3>
                  </div>

                  {isActive ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E6F4EA] text-[#137333]">
                      Active & Unlocked
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-mineral text-ink-muted">
                      Locked
                    </span>
                  )}
                </div>

                {/* Directory path */}
                <div className="mt-3 p-2.5 bg-mineral/40 rounded-xl border border-line/60">
                  <div className="text-[10px] uppercase font-bold text-ink-muted/70 tracking-wider">
                    Vault Directory
                  </div>
                  <div className="text-xs font-mono text-ink font-medium truncate mt-0.5" title={ws.path}>
                    {ws.path}
                  </div>
                </div>

                <div className="mt-3 text-[11px] text-ink-muted flex items-center justify-between">
                  <span>Last opened:</span>
                  <span className="font-medium text-ink">{formatDate(ws.lastOpened)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-line/60 flex items-center justify-between gap-2">
                {isActive ? (
                  <button
                    onClick={onLockActiveWorkspace}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-mineral text-ink hover:bg-mineral/80 transition"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Lock Session
                  </button>
                ) : (
                  <button
                    onClick={() => onSelectWorkspace(ws)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-vault-green text-white hover:bg-vault-hover transition shadow-xs"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    Switch & Unlock
                  </button>
                )}

                {!isActive && (
                  <button
                    onClick={() => onRemoveWorkspace(ws)}
                    className="p-2 rounded-xl text-ink-muted hover:text-red-600 hover:bg-red-50 transition border border-line"
                    title="Remove from list (files on disk are preserved)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Security Guidance Note */}
      <div className="bg-surface-card p-6 rounded-2xl border border-line shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-ink">
          <ShieldCheck className="w-4 h-4 text-vault-green" />
          Multi-Workspace Cryptographic Boundary
        </div>
        <p className="text-xs text-ink-muted leading-relaxed">
          Each workspace operates under a distinct 256-bit Workspace Master Key (WMK) and independent zero-plaintext SQLite database. Unlocking one workspace provides zero mathematical access to any other workspace on this device or in Google Drive. When switching workspaces, active keys in memory are automatically scrubbed.
        </p>
      </div>
    </div>
  );
};
