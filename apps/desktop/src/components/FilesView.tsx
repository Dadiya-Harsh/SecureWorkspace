import React, { useState } from "react";
import {
  Search,
  Plus,
  ArrowUp,
  Check,
  RefreshCw,
  ExternalLink,
  Download,
  History,
} from "lucide-react";
import { WorkspaceFile, FileStatus } from "../api/types";

interface FilesViewProps {
  files: WorkspaceFile[];
  onAddFiles: () => void;
  onOpenFile: (file: WorkspaceFile) => void;
  onExportFile: (file: WorkspaceFile) => void;
  onViewHistory: (file: WorkspaceFile) => void;
  onDeleteFile?: (file: WorkspaceFile) => void;
}

export const FilesView: React.FC<FilesViewProps> = ({
  files,
  onAddFiles,
  onOpenFile,
  onExportFile,
  onViewHistory,
  onDeleteFile,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState<WorkspaceFile | null>(
    files.length > 0 ? files[0] : null
  );

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderStatusBadge = (status: FileStatus) => {
    switch (status) {
      case "not_pushed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#E8F0FE] text-[#1A73E8]">
            <ArrowUp className="w-3 h-3" />
            Not pushed
          </span>
        );
      case "synced":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#E6F4EA] text-[#137333]">
            <Check className="w-3 h-3" />
            In Drive
          </span>
        );
      case "cloud_only":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#F1F3F4] text-[#5F6368]">
            - Cloud only
          </span>
        );
      case "changed_in_both":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#FCE8E6] text-[#C5221F]">
            <RefreshCw className="w-3 h-3" />
            Changed in both
          </span>
        );
      default:
        return null;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  return (
    <div className="relative p-8 max-w-6xl mx-auto space-y-6 pb-28">
      {/* Top Controls: Breadcrumb & Search & Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-base font-semibold text-ink">
          <span className="text-ink-muted">Documents</span>
          <span className="text-ink-muted/50">/</span>
          <span>Taxes</span>
        </div>

        {/* Search Bar & Add Button */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search names"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-line bg-surface-card text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-vault-green"
            />
          </div>

          <button
            onClick={onAddFiles}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium bg-vault-green text-white hover:bg-vault-hover transition shadow-sm flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add files
          </button>
        </div>
      </div>

      {/* File Table Card */}
      <div className="bg-surface-card rounded-xl border border-line shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-line bg-mineral/30 text-xs font-semibold text-ink-muted">
              <th className="py-3 px-6">Name</th>
              <th className="py-3 px-6">Size</th>
              <th className="py-3 px-6">Modified</th>
              <th className="py-3 px-6">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60 text-sm">
            {filteredFiles.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-sm text-ink-muted">
                  {searchQuery ? "No matching files found." : "No files in this workspace yet. Click \"+ Add files\" to start adding documents."}
                </td>
              </tr>
            ) : (
              filteredFiles.map((file) => {
                const isSelected = selectedFile?.path === file.path;
                return (
                  <tr
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? "bg-vault-subtle/50" : "hover:bg-mineral/20"
                    }`}
                  >
                    <td className="py-3.5 px-6 font-medium text-ink">
                      {file.name}
                    </td>
                    <td className="py-3.5 px-6 text-ink-muted">
                      {formatSize(file.size_bytes)}
                    </td>
                    <td className="py-3.5 px-6 text-ink-muted">
                      {file.modified_at}
                    </td>
                    <td className="py-3.5 px-6">
                      {renderStatusBadge(file.status)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Selected File Docked Action Bar (as designed in Files.png) */}
      {selectedFile && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-4rem)] max-w-4xl bg-ink text-white rounded-xl shadow-xl px-6 py-3.5 flex items-center justify-between z-20 border border-line-dark/60">
          <div className="font-semibold text-sm tracking-tight truncate max-w-xs sm:max-w-md">
            {selectedFile.name}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onOpenFile(selectedFile)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-ink text-xs font-semibold rounded-lg hover:bg-mineral transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open file
            </button>
            <button
              onClick={() => onExportFile(selectedFile)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-ink text-xs font-semibold rounded-lg hover:bg-mineral transition"
            >
              <Download className="w-3.5 h-3.5" />
              Export a copy
            </button>
            <button
              onClick={() => onViewHistory(selectedFile)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-ink text-xs font-semibold rounded-lg hover:bg-mineral transition"
            >
              <History className="w-3.5 h-3.5" />
              History
            </button>
            {onDeleteFile && (
              <button
                onClick={() => onDeleteFile(selectedFile)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/90 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition"
                title="Delete file"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
