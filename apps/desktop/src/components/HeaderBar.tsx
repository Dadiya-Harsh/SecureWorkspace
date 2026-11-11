import React from "react";
import { ArrowUp, Check, AlertCircle } from "lucide-react";

interface HeaderBarProps {
  accountName: string;
  accountEmail: string;
  pushCount: number;
  isUpToDate: boolean;
  isDiverged?: boolean;
  onPushClick: () => void;
  onDivergedClick?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  accountName,
  accountEmail,
  pushCount,
  isUpToDate,
  isDiverged,
  onPushClick,
  onDivergedClick,
}) => {
  return (
    <header className="h-16 bg-surface border-b border-line flex items-center justify-between px-8 select-none">
      {/* Account Info */}
      <div className="flex items-center gap-2 text-sm font-medium text-ink">
        <span>{accountName}</span>
        <span className="text-ink-muted text-xs">[{accountEmail}]</span>
      </div>

      {/* Sync Status Badge & Action */}
      <div className="flex items-center gap-3">
        {isDiverged ? (
          <button
            onClick={onDivergedClick}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-[#FCE8E6] text-[#C5221F] border border-[#F5C2B8] hover:bg-[#F9D7D2] transition"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            ↑↓ Diverged
          </button>
        ) : pushCount > 0 ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-[#E8F0FE] text-[#1A73E8]">
            <ArrowUp className="w-3.5 h-3.5" />
            ↑ {pushCount} to push
          </div>
        ) : isUpToDate ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-[#E6F4EA] text-[#137333]">
            <Check className="w-3.5 h-3.5" />
            ✓ Up to date
          </div>
        ) : null}

        {/* Primary Action Button */}
        {pushCount > 0 ? (
          <button
            onClick={onPushClick}
            className="px-4 py-1.5 rounded-lg text-sm font-medium bg-vault-green text-white hover:bg-vault-hover transition shadow-sm"
          >
            Push {pushCount} changes
          </button>
        ) : (
          <button
            onClick={onPushClick}
            className="px-4 py-1.5 rounded-lg text-sm font-medium bg-surface text-ink-muted border border-line hover:bg-mineral/50 transition"
          >
            Push
          </button>
        )}
      </div>
    </header>
  );
};
