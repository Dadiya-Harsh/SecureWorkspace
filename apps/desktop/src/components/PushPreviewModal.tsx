import React, { useState, useEffect } from "react";
import {
  X,
  ArrowUp,
  AlertTriangle,
  Upload,
  FileEdit,
  Trash2,
  Loader2,
} from "lucide-react";
import { api } from "../api/client";
import { PushPreviewData } from "../api/types";

interface PushPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newVersion: number) => void;
  onDiverged?: () => void;
}

export const PushPreviewModal: React.FC<PushPreviewModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onDiverged,
}) => {
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PushPreviewData | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [commitMessage, setCommitMessage] = useState("");
  const [isPushing, setIsPushing] = useState(false);
  const [confirmMassDeletion, setConfirmMassDeletion] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoadingPreview(true);
      setErrorMessage("");
      setCommitMessage("");
      setConfirmMassDeletion(false);
      api
        .pushPreview()
        .then((res) => {
          if (res.success && res.data) {
            setPreviewData(res.data);
            if (res.data.is_refused) {
              setErrorMessage(
                res.data.refusal_reason ||
                  "Push refused: remote Drive version is ahead. Please pull first."
              );
            }
          } else {
            setErrorMessage(res.message || "Failed to load push preview.");
          }
        })
        .catch((err) => {
          setErrorMessage(err?.message || "Error contacting core engine.");
        })
        .finally(() => {
          setLoadingPreview(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirmPush = async () => {
    if (previewData?.is_mass_deletion && !confirmMassDeletion) {
      setErrorMessage("Please check the confirmation box below to proceed with mass deletion.");
      return;
    }

    setIsPushing(true);
    setErrorMessage("");

    try {
      const res = await api.push(commitMessage.trim(), confirmMassDeletion);
      if (res.success && res.data) {
        onSuccess(res.data.new_version);
        onClose();
      } else {
        if (res.error_code === "DRIVE_AHEAD" || res.error_code === "DIVERGED") {
          onClose();
          if (onDiverged) onDiverged();
        } else {
          setErrorMessage(res.message || "Push failed.");
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to push changes.");
    } finally {
      setIsPushing(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${bytes} B`;
  };

  const uploadCount = previewData?.upload_count ?? 0;
  const deleteCount = previewData?.delete_count ?? 0;
  const totalCount = uploadCount + deleteCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs select-none animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-surface rounded-2xl shadow-2xl border border-line overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-line flex items-center justify-between bg-surface-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-vault-green/10 text-vault-green flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink">Push Changes to Drive</h2>
              <p className="text-xs text-ink-muted">
                {previewData ? `Creating version ${previewData.base_version + 1}` : "Analyzing workspace..."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isPushing}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-mineral transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {loadingPreview ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-ink-muted">
              <Loader2 className="w-6 h-6 animate-spin text-vault-green" />
              <span className="text-sm font-medium">Scanning local changes...</span>
            </div>
          ) : errorMessage && previewData?.is_refused ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-red-700">
                <AlertTriangle className="w-4 h-4" />
                Remote Drive is Ahead
              </div>
              <p className="text-xs text-red-600 leading-relaxed">{errorMessage}</p>
              <div className="pt-2">
                <button
                  onClick={() => {
                    onClose();
                    if (onDiverged) onDiverged();
                  }}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition"
                >
                  Review Sync Status & Pull
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Mass Deletion Alert Guard */}
              {previewData?.is_mass_deletion && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold text-amber-900">
                        Mass Deletion Guard Triggered
                      </div>
                      <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                        More than 50% of the active files in this workspace are being deleted ({deleteCount} files). This safety guard prevents accidental wiping of your workspace.
                      </p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 pt-2 border-t border-amber-200/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmMassDeletion}
                      onChange={(e) => setConfirmMassDeletion(e.target.checked)}
                      className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
                    />
                    <span className="text-xs font-semibold text-amber-900">
                      I understand and confirm deleting these files on Google Drive
                    </span>
                  </label>
                </div>
              )}

              {/* Commit Message Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-ink">
                  Version Note / Commit Message <span className="text-ink-muted font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Updated tax return and passport scan"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  disabled={isPushing}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-surface-card text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-vault-green"
                />
              </div>

              {/* Files Summary & Breakdown */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-ink-muted">
                  <span>Changes to encrypt & push ({totalCount})</span>
                  <span>{uploadCount} added/modified, {deleteCount} deleted</span>
                </div>

                <div className="border border-line rounded-xl divide-y divide-line/60 max-h-48 overflow-y-auto bg-surface-card">
                  {totalCount === 0 ? (
                    <div className="py-6 text-center text-xs text-ink-muted">
                      No local changes detected.
                    </div>
                  ) : (
                    <>
                      {previewData?.files_to_upload.map((file) => (
                        <div
                          key={file.relative_path}
                          className="px-4 py-2.5 flex items-center justify-between text-xs hover:bg-mineral/20"
                        >
                          <div className="flex items-center gap-2.5 truncate max-w-[280px]">
                            <FileEdit className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                            <span className="font-mono text-ink truncate">{file.relative_path}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-ink-muted">{formatSize(file.size_bytes)}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#E8F0FE] text-[#1A73E8]">
                              Upload
                            </span>
                          </div>
                        </div>
                      ))}

                      {previewData?.files_to_delete.map((file) => (
                        <div
                          key={file.relative_path}
                          className="px-4 py-2.5 flex items-center justify-between text-xs hover:bg-mineral/20"
                        >
                          <div className="flex items-center gap-2.5 truncate max-w-[280px]">
                            <Trash2 className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                            <span className="font-mono text-ink-muted line-through truncate">
                              {file.relative_path}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-600">
                            Delete
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {errorMessage && !previewData?.is_refused && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-600">
                  {errorMessage}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 px-6 border-t border-line bg-surface-card flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={isPushing}
            className="px-4 py-2 text-sm font-medium text-ink-muted hover:text-ink hover:bg-mineral rounded-lg transition"
          >
            Cancel
          </button>

          <button
            onClick={handleConfirmPush}
            disabled={
              loadingPreview ||
              isPushing ||
              Boolean(previewData?.is_refused) ||
              (previewData?.is_mass_deletion && !confirmMassDeletion) ||
              totalCount === 0
            }
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-vault-green text-white hover:bg-vault-hover transition shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {isPushing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Encrypting & Pushing...
              </>
            ) : (
              <>
                <ArrowUp className="w-4 h-4" />
                Confirm Push (v{(previewData?.base_version ?? 0) + 1})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
