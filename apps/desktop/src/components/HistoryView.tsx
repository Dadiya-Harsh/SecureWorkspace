import React, { useState, useEffect } from "react";
import {
  History,
  RotateCcw,
  Shield,
  Clock,
  Laptop,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ArrowDownLeft,
  Trash2,
} from "lucide-react";
import { api } from "../api/client";
import { RemoteVersion, SafetySnapshotItem } from "../api/types";

interface HistoryViewProps {
  currentVersion: number;
  onVersionReverted: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  currentVersion,
  onVersionReverted,
}) => {
  const [subTab, setSubTab] = useState<"versions" | "snapshots">("versions");
  const [versions, setVersions] = useState<RemoteVersion[]>([]);
  const [snapshots, setSnapshots] = useState<SafetySnapshotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Selected version for details / file restore
  const [selectedVersion, setSelectedVersion] = useState<RemoteVersion | null>(null);

  const loadData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [vRes, sRes] = await Promise.all([
        api.listRemoteVersions(),
        api.listSafetySnapshots(),
      ]);

      if (vRes.success && vRes.data?.versions) {
        setVersions(vRes.data.versions);
        if (vRes.data.versions.length > 0) {
          setSelectedVersion(vRes.data.versions[0]);
        }
      }
      if (sRes.success && sRes.data?.snapshots) {
        setSnapshots(sRes.data.snapshots);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to load history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRevertWorkspace = async (ver: number) => {
    const ok = window.confirm(
      `Revert entire workspace to Version ${ver}?\n\nThis will stage the previous files as your new local state. You can review them before pushing.`
    );
    if (!ok) return;

    setActionLoading(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const res = await api.revertWorkspace(ver, true);
      if (res.success) {
        setStatusMessage(`✓ Workspace successfully reverted to version ${ver}.`);
        onVersionReverted();
      } else {
        setErrorMessage(res.message || "Failed to revert workspace.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Error during workspace revert.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreFile = async (filePath: string, ver: number) => {
    const ok = window.confirm(`Restore '${filePath}' from Version ${ver}?`);
    if (!ok) return;

    setActionLoading(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const res = await api.restoreFileVersion(filePath, ver);
      if (res.success) {
        setStatusMessage(`✓ Restored '${filePath}' from Version ${ver}.`);
        onVersionReverted();
      } else {
        setErrorMessage(res.message || "Failed to restore file.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Error restoring file.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreSnapshot = async (snapshotId: string, originalPath: string) => {
    const ok = window.confirm(
      `Restore local safety snapshot for '${originalPath}'?\n\nThis will overwrite any current changes to this file.`
    );
    if (!ok) return;

    setActionLoading(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const res = await api.restoreSafetySnapshot(snapshotId);
      if (res.success) {
        setStatusMessage(`✓ Restored snapshot '${snapshotId}'.`);
        onVersionReverted();
        loadData();
      } else {
        setErrorMessage(res.message || "Failed to restore safety snapshot.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Error restoring snapshot.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSnapshot = async (snapshotId: string) => {
    const ok = window.confirm(`Delete safety snapshot '${snapshotId}'?`);
    if (!ok) return;

    try {
      const res = await api.deleteSafetySnapshot(snapshotId);
      if (res.success) {
        setSnapshots((prev) => prev.filter((s) => s.snapshot_id !== snapshotId));
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Error deleting snapshot.");
    }
  };

  const formatDate = (epochMs: number) => {
    return new Date(epochMs).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${bytes} B`;
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Header and Sub-Tab Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-ink flex items-center gap-2">
            <History className="w-5 h-5 text-vault-green" />
            Workspace History & Snapshots
          </h2>
          <p className="text-xs text-ink-muted mt-1">
            Browse remote versions, rollback whole states, or restore single files from pre-pull snapshots.
          </p>
        </div>

        {/* Pill switcher */}
        <div className="flex items-center gap-1 p-1 bg-surface-card border border-line rounded-lg text-xs font-medium">
          <button
            onClick={() => setSubTab("versions")}
            className={`px-3 py-1.5 rounded-md transition ${
              subTab === "versions"
                ? "bg-vault-green text-white shadow-xs"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            Remote Versions ({versions.length})
          </button>
          <button
            onClick={() => setSubTab("snapshots")}
            className={`px-3 py-1.5 rounded-md transition ${
              subTab === "snapshots"
                ? "bg-vault-green text-white shadow-xs"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            Local Safety Snapshots ({snapshots.length})
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          {statusMessage}
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          {errorMessage}
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-ink-muted">
          <Loader2 className="w-6 h-6 animate-spin text-vault-green" />
          <span className="text-sm font-medium">Loading history from Drive & local cache...</span>
        </div>
      ) : subTab === "versions" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Versions List (Left 1 col) */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Version Timeline
            </h3>

            {versions.length === 0 ? (
              <div className="p-6 bg-surface-card rounded-xl border border-line text-center text-xs text-ink-muted">
                No remote versions found. Push your workspace to create version 1.
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {versions.map((ver) => {
                  const isCurrent = ver.version_number === currentVersion;
                  const isSelected = selectedVersion?.version_number === ver.version_number;

                  return (
                    <div
                      key={ver.version_number}
                      onClick={() => setSelectedVersion(ver)}
                      className={`p-4 rounded-xl border transition cursor-pointer ${
                        isSelected
                          ? "bg-surface-card border-vault-green shadow-xs"
                          : "bg-surface-card/60 border-line hover:border-line-dark/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-ink flex items-center gap-2">
                          Version {ver.version_number}
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#E6F4EA] text-[#137333]">
                              HEAD
                            </span>
                          )}
                        </span>
                        <span className="text-[11px] text-ink-muted flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(ver.timestamp_ms)}
                        </span>
                      </div>

                      <p className="text-xs text-ink mt-1.5 font-medium line-clamp-2">
                        {ver.message || "Version commit"}
                      </p>

                      <div className="mt-3 flex items-center justify-between text-[11px] text-ink-muted">
                        <span className="flex items-center gap-1 font-mono">
                          <Laptop className="w-3 h-3" />
                          {ver.device_id}
                        </span>
                        <span>{ver.entries?.length ?? 0} files</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Version Detail Card (Right 2 cols) */}
          <div className="lg:col-span-2">
            {selectedVersion ? (
              <div className="bg-surface-card rounded-xl border border-line p-6 shadow-xs space-y-6">
                {/* Header detail */}
                <div className="flex items-start justify-between pb-4 border-b border-line">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-ink">
                        Version {selectedVersion.version_number}
                      </h3>
                      {selectedVersion.version_number === currentVersion && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E6F4EA] text-[#137333]">
                          Current Workspace
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink-muted mt-1">
                      Committed on {formatDate(selectedVersion.timestamp_ms)} by device{" "}
                      <span className="font-mono text-ink">{selectedVersion.device_id}</span>
                    </p>
                    <p className="text-sm font-medium text-ink mt-3 p-3 bg-mineral/40 rounded-lg border border-line">
                      "{selectedVersion.message || "No commit message recorded."}"
                    </p>
                  </div>

                  {selectedVersion.version_number !== currentVersion && (
                    <button
                      onClick={() => handleRevertWorkspace(selectedVersion.version_number)}
                      disabled={actionLoading}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-vault-green text-white hover:bg-vault-hover transition shadow-xs disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Revert Entire Workspace
                    </button>
                  )}
                </div>

                {/* Encrypted entries inside this version */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-ink-muted uppercase tracking-wider">
                    <span>Snapshot Files ({selectedVersion.entries?.length ?? 0})</span>
                    <span>Action</span>
                  </div>

                  <div className="divide-y divide-line/60 border border-line rounded-xl overflow-hidden max-h-[380px] overflow-y-auto">
                    {selectedVersion.entries && selectedVersion.entries.length > 0 ? (
                      selectedVersion.entries.map((entry) => (
                        <div
                          key={entry.path}
                          className="p-3 px-4 flex items-center justify-between text-xs hover:bg-mineral/20"
                        >
                          <div className="flex items-center gap-2.5 truncate max-w-md">
                            <FileText className="w-4 h-4 text-vault-green flex-shrink-0" />
                            <div>
                              <div className="font-mono font-medium text-ink truncate">
                                {entry.path}
                              </div>
                              <div className="text-[10px] text-ink-muted">
                                {formatSize(entry.size)} • sha: {entry.sha256.substring(0, 10)}...
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() =>
                              handleRestoreFile(entry.path, selectedVersion.version_number)
                            }
                            disabled={actionLoading}
                            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium border border-line rounded-lg text-ink hover:bg-mineral transition"
                          >
                            <ArrowDownLeft className="w-3 h-3 text-vault-green" />
                            Restore File
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-xs text-ink-muted">
                        No files contained in this version manifest.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-sm text-ink-muted bg-surface-card rounded-xl border border-line">
                Select a version from the timeline on the left to inspect its details.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Local Safety Snapshots Section */
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-900 leading-relaxed flex items-start gap-3">
            <Shield className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Zero-Data-Loss Safety Net:</strong> Before pulling remote updates or resolving merge conflicts, SecureWorkspace saves a local encrypted safety snapshot of any files that would be overwritten. If a pull wasn't what you expected, you can restore your file below instantly.
            </div>
          </div>

          <div className="bg-surface-card rounded-xl border border-line overflow-hidden shadow-xs">
            {snapshots.length === 0 ? (
              <div className="py-12 text-center text-xs text-ink-muted">
                No safety snapshots recorded yet. Snapshots are created automatically before pulls that overwrite local edits.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-line bg-mineral/30 text-[11px] font-semibold text-ink-muted uppercase">
                    <th className="py-3 px-6">File Path</th>
                    <th className="py-3 px-6">Reason</th>
                    <th className="py-3 px-6">Created</th>
                    <th className="py-3 px-6">Size</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60 text-xs">
                  {snapshots.map((snap) => (
                    <tr key={snap.snapshot_id} className="hover:bg-mineral/20">
                      <td className="py-3 px-6 font-mono font-medium text-ink">
                        {snap.original_path}
                      </td>
                      <td className="py-3 px-6">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700">
                          {snap.reason}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-ink-muted">
                        {formatDate(snap.timestamp_ms)}
                      </td>
                      <td className="py-3 px-6 text-ink-muted">
                        {formatSize(snap.size)}
                      </td>
                      <td className="py-3 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              handleRestoreSnapshot(snap.snapshot_id, snap.original_path)
                            }
                            disabled={actionLoading}
                            className="px-2.5 py-1 text-xs font-semibold bg-vault-green text-white rounded-lg hover:bg-vault-hover transition"
                          >
                            Restore
                          </button>
                          <button
                            onClick={() => handleDeleteSnapshot(snap.snapshot_id)}
                            disabled={actionLoading}
                            className="p-1 text-ink-muted hover:text-red-600 rounded transition"
                            title="Delete snapshot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
