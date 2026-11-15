import React from 'react';
import { useVaultStore } from '../../store/useVaultStore';
import { BreadcrumbNav } from './BreadcrumbNav';
import type { DecryptedManifestEntry } from '../../types/crypto';
import {
  Folder,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  FileCode,
  Search,
  ChevronDown,
} from 'lucide-react';

export const FileTable: React.FC = () => {
  const unlockedManifest = useVaultStore((s) => s.unlockedManifest);
  const currentDirectory = useVaultStore((s) => s.currentDirectory);
  const setCurrentDirectory = useVaultStore((s) => s.setCurrentDirectory);
  const setSelectedFile = useVaultStore((s) => s.setSelectedFile);
  const searchQuery = useVaultStore((s) => s.searchQuery);
  const setSearchQuery = useVaultStore((s) => s.setSearchQuery);

  const entries = unlockedManifest?.entries || [];

  // Group into current folder items or search results
  const normCurrentDir = currentDirectory.replace(/^\/+|\/+$/g, '');

  let visibleFolders: string[] = [];
  let visibleFiles: DecryptedManifestEntry[] = [];

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    visibleFiles = entries.filter((e) => e.path.toLowerCase().includes(q));
  } else {
    const subfolderSet = new Set<string>();

    for (const entry of entries) {
      const normPath = entry.path.replace(/^\/+|\/+$/g, '');

      if (!normCurrentDir) {
        // At root
        const slashIdx = normPath.indexOf('/');
        if (slashIdx === -1) {
          visibleFiles.push(entry);
        } else {
          subfolderSet.add(normPath.substring(0, slashIdx));
        }
      } else if (normPath.startsWith(normCurrentDir + '/')) {
        const remaining = normPath.substring(normCurrentDir.length + 1);
        const slashIdx = remaining.indexOf('/');
        if (slashIdx === -1) {
          visibleFiles.push(entry);
        } else {
          subfolderSet.add(remaining.substring(0, slashIdx));
        }
      }
    }

    visibleFolders = Array.from(subfolderSet).sort();
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatModifiedDate = (ms: number): string => {
    if (!ms) return '—';
    const d = new Date(ms);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getFileIcon = (fileName: string) => {
    const lower = fileName.toLowerCase();
    if (lower.endsWith('.csv') || lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
      return <FileSpreadsheet className="w-4 h-4 text-[#0F5C4D]" />;
    }
    if (lower.endsWith('.pdf')) {
      return <FileText className="w-4 h-4 text-[#9B2F1F]" />;
    }
    if (lower.endsWith('.docx') || lower.endsWith('.doc')) {
      return <FileText className="w-4 h-4 text-[#1E40AF]" />;
    }
    if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
      return <ImageIcon className="w-4 h-4 text-[#2563EB]" />;
    }
    if (lower.endsWith('.json') || lower.endsWith('.ts') || lower.endsWith('.js') || lower.endsWith('.py')) {
      return <FileCode className="w-4 h-4 text-[#D97706]" />;
    }
    return <FileText className="w-4 h-4 text-[#5A6662]" />;
  };

  const getBasename = (fullPath: string): string => {
    const parts = fullPath.split('/');
    return parts[parts.length - 1];
  };

  return (
    <div className="flex-1 flex flex-col bg-[#EDF0ED]">
      {/* Top Warning Banner matching mockup exactly */}
      <div className="bg-[#F6EED8] text-[#543D15] px-6 sm:px-10 py-3 text-sm font-medium border-b border-[#EDE2C5]">
        Read-only view. To change files, use the desktop app.
      </div>

      <div className="flex-1 p-6 sm:p-10 max-w-5xl w-full mx-auto space-y-8">
        {/* Header Bar: Breadcrumbs + Dropdown & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <BreadcrumbNav />

          <div className="flex items-center gap-3">
            {/* Version Selector */}
            <div className="relative">
              <button
                type="button"
                className="bg-white border border-[#D5DDD7] hover:border-[#BAC5BD] text-[#14201C] text-sm font-medium px-3.5 py-2 rounded-lg flex items-center gap-2 cursor-pointer shadow-2xs"
              >
                <span>Version {unlockedManifest?.version_number || 1} (latest)</span>
                <ChevronDown className="w-4 h-4 text-[#5A6662]" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-[#8E9A96] absolute left-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search names"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border border-[#D5DDD7] focus:border-[#0F5C4D] focus:ring-1 focus:ring-[#0F5C4D] text-[#14201C] text-sm pl-8 pr-3.5 py-2 rounded-lg outline-none w-44 sm:w-56 placeholder:text-[#8E9A96] shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Files Table Container */}
        <div className="bg-white/40 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#D8DFDA] text-xs font-medium text-[#5A6662]">
                <th className="py-3 px-4 font-normal">Name</th>
                <th className="py-3 px-4 font-normal w-24">Size</th>
                <th className="py-3 px-4 font-normal w-28">Modified</th>
                <th className="py-3 px-4 font-normal w-28"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0E6E1]">
              {/* Folder Rows */}
              {visibleFolders.map((folderName) => (
                <tr
                  key={folderName}
                  onClick={() => {
                    const nextDir = normCurrentDir
                      ? `${normCurrentDir}/${folderName}`
                      : folderName;
                    setCurrentDirectory(nextDir);
                  }}
                  className="hover:bg-[#E5EAE6] transition-colors cursor-pointer group"
                >
                  <td className="py-4 px-4 font-semibold text-[#14201C] flex items-center gap-2.5">
                    <Folder className="w-4 h-4 text-[#0F5C4D] fill-[#0F5C4D]/20 group-hover:fill-[#0F5C4D]/30" />
                    <span>{folderName}</span>
                  </td>
                  <td className="py-4 px-4 text-[#5A6662] text-xs">—</td>
                  <td className="py-4 px-4 text-[#5A6662] text-xs">—</td>
                  <td className="py-4 px-4"></td>
                </tr>
              ))}

              {/* File Rows */}
              {visibleFiles.map((entry) => {
                const name = getBasename(entry.path);
                const isSensitive =
                  name.toLowerCase().includes('password') ||
                  name.toLowerCase().includes('secret') ||
                  name.toLowerCase().includes('key');

                return (
                  <tr
                    key={entry.file_id_hex}
                    onClick={() => setSelectedFile(entry)}
                    className="hover:bg-[#E5EAE6] transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-4 font-semibold text-[#14201C]">
                      <div className="flex items-center gap-2.5">
                        {getFileIcon(name)}
                        <span className="hover:underline">{name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-[#14201C] font-mono text-xs">
                      {formatFileSize(entry.size)}
                    </td>
                    <td className="py-4 px-4 text-[#5A6662] text-xs">
                      {formatModifiedDate(entry.mtime_ms)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      {isSensitive && (
                        <span className="inline-block px-2 py-0.5 rounded text-xs text-[#5A6662] bg-[#E2E6E3] font-medium">
                          – Sensitive
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {visibleFolders.length === 0 && visibleFiles.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-[#5A6662]">
                    No files found {searchQuery ? `matching "${searchQuery}"` : 'in this folder'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Disclaimer */}
        <p className="text-xs text-[#5A6662]">
          Files open in this tab only. Nothing is cached after you lock.
        </p>
      </div>
    </div>
  );
};
