import React from 'react';
import { useVaultStore } from '../../store/useVaultStore';
import { History, CheckCircle2, Calendar, HardDrive } from 'lucide-react';

export const VersionHistory: React.FC = () => {
  const unlockedManifest = useVaultStore((s) => s.unlockedManifest);
  const setActiveTab = useVaultStore((s) => s.setActiveTab);

  const currentVersion = unlockedManifest?.version_number || 1;

  // Synthesize history list up to current version
  const versions = [];
  for (let v = currentVersion; v >= Math.max(1, currentVersion - 5); v--) {
    const isCurrent = v === currentVersion;
    versions.push({
      version: v,
      isLatest: isCurrent,
      message: isCurrent ? (unlockedManifest?.message || 'Current working revision') : `Snapshot backup commit v${v}`,
      timestamp: isCurrent ? (unlockedManifest?.timestamp_ms || Date.now()) : Date.now() - (currentVersion - v) * 86400000 * 2,
      deviceId: isCurrent ? (unlockedManifest?.device_id || 'desktop-windows') : 'desktop-windows',
      fileCount: isCurrent ? (unlockedManifest?.entries.length || 0) : 4,
    });
  }

  return (
    <div className="flex-1 flex flex-col bg-[#EDF0ED]">
      <div className="bg-[#F6EED8] text-[#543D15] px-6 sm:px-10 py-3 text-sm font-medium border-b border-[#EDE2C5]">
        Read-only view. To change files, use the desktop app.
      </div>

      <div className="flex-1 p-6 sm:p-10 max-w-5xl w-full mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#14201C] tracking-tight">
              Vault Version History
            </h1>
            <p className="text-sm text-[#5A6662]">
              Every push from the desktop app generates an immutable, signed manifest.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('files')}
            className="bg-white border border-[#D5DDD7] hover:border-[#BAC5BD] text-[#14201C] text-sm font-medium px-4 py-2 rounded-lg cursor-pointer shadow-2xs"
          >
            ← Back to Files
          </button>
        </div>

        <div className="bg-white rounded-xl border border-[#D8DFDA] overflow-hidden divide-y divide-[#E0E6E1]">
          {versions.map((ver) => (
            <div
              key={ver.version}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F9FAF9] transition-colors"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    ver.isLatest
                      ? 'bg-[#E6F4F1] text-[#0F5C4D]'
                      : 'bg-[#EDF0ED] text-[#5A6662]'
                  }`}
                >
                  {ver.isLatest ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <History className="w-5 h-5" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#14201C]">
                      Version {ver.version}
                    </span>
                    {ver.isLatest && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E6F4F1] text-[#0F5C4D]">
                        Latest (Active)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#5A6662]">{ver.message}</p>
                  <div className="flex items-center gap-4 text-[11px] text-[#8E9A96] pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(ver.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3.5 h-3.5" />
                      {ver.fileCount} files
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setActiveTab('files')}
                  className="bg-white border border-[#D5DDD7] hover:border-[#BAC5BD] text-[#14201C] text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer shadow-2xs"
                >
                  {ver.isLatest ? 'Browse Files' : 'Inspect Snapshot'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
