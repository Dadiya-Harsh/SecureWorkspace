import React from "react";
import { ArrowUp, Check, AlertTriangle, HardDrive } from "lucide-react";
import { SyncStatusData } from "../api/types";

interface DashboardViewProps {
  status: SyncStatusData;
  onPush: () => void;
  onBackup: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  status,
  onPush,
  onBackup,
}) => {
  const pendingCount =
    status.changes.new.length +
    status.changes.modified.length +
    status.changes.deleted.length;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Status & Changes Card (2 columns) */}
        <div className="lg:col-span-2 bg-surface-card rounded-xl border border-line p-6 shadow-sm">
          {/* Header with Version Ring & Status Text */}
          <div className="flex items-center gap-6 pb-6 border-b border-line">
            {/* Version Donut Ring */}
            <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-mineral stroke-current"
                  strokeWidth="3.5"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-vault-green stroke-current"
                  strokeDasharray="75, 100"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-base font-semibold text-ink">
                v{status.base_version}
              </span>
            </div>

            {/* Status Information */}
            <div className="flex-1 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-ink">
                  {pendingCount > 0 ? `${pendingCount} changes waiting` : "Up to date"}
                </h2>
                <p className="text-sm text-ink-muted mt-1">
                  On version {status.base_version}, same as Drive.
                </p>
              </div>

              {pendingCount > 0 && (
                <button
                  onClick={onPush}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium bg-vault-green text-white hover:bg-vault-hover transition shadow-sm"
                >
                  Push changes
                </button>
              )}
            </div>
          </div>

          {/* Pending Changes Table */}
          <div className="mt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-3">
              Waiting to push
            </h3>

            {pendingCount === 0 ? (
              <div className="py-8 text-center text-sm text-ink-muted">
                No local changes waiting. Your workspace matches Drive version {status.base_version}.
              </div>
            ) : (
              <div className="divide-y divide-line/60">
                {status.changes.modified.map((file) => (
                  <div key={file.relative_path} className="py-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-ink font-mono">
                      {file.relative_path}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E8F0FE] text-[#1A73E8]">
                      <ArrowUp className="w-3 h-3" />
                      Changed
                    </span>
                  </div>
                ))}

                {status.changes.new.map((file) => (
                  <div key={file.relative_path} className="py-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-ink font-mono">
                      {file.relative_path}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E6F4EA] text-[#137333]">
                      <Check className="w-3 h-3" />
                      Added
                    </span>
                  </div>
                ))}

                {status.changes.deleted.map((file) => (
                  <div key={file.relative_path} className="py-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-ink font-mono line-through text-ink-muted">
                      {file.relative_path}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FCE8E6] text-[#C5221F]">
                      <AlertTriangle className="w-3 h-3" />
                      Deleted
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Backup Widget (1 column) */}
        <div className="bg-surface-card rounded-xl border border-line p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-ink font-semibold mb-2">
              <HardDrive className="w-5 h-5 text-vault-green" />
              <span>External HDD</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-mineral text-ink-muted my-2">
              <span>↓ Last verified 9 days ago</span>
            </div>

            <p className="text-xs text-ink-muted leading-relaxed mt-4">
              Drive is not an independent backup. Keep a local offline copy on an external drive to protect against account lockout or ransomware.
            </p>
          </div>

          <div className="pt-6 border-t border-line mt-6">
            <button
              onClick={onBackup}
              className="w-full py-2 px-4 rounded-lg text-sm font-medium border border-line hover:bg-mineral/60 text-ink transition"
            >
              Back up now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
