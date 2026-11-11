import React, { useState } from "react";
import { RefreshCw } from "lucide-react";

interface DivergedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPullKeepDrive: () => void;
  onKeepBoth: () => void;
  onForcePush: () => void;
}

export const DivergedModal: React.FC<DivergedModalProps> = ({
  isOpen,
  onClose,
  onPullKeepDrive,
  onKeepBoth,
  onForcePush,
}) => {
  const [confirmInput, setConfirmInput] = useState("");

  if (!isOpen) return null;

  const isForcePushAllowed = confirmInput.trim() === "PUSH";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-night/60 backdrop-blur-xs select-none">
      <div className="bg-surface-card rounded-2xl border border-line shadow-2xl max-w-xl w-full p-7 space-y-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div>
          <h2 className="text-xl font-bold text-ink">
            Drive and this device both changed
          </h2>
          <p className="text-sm text-ink-muted mt-2 leading-relaxed">
            Drive has 2 newer versions from Phone. This device has 3 unpushed changes. Nothing is lost whichever you pick.
          </p>
        </div>

        {/* 2-Column Comparison Table */}
        <div className="border border-line rounded-xl overflow-hidden divide-y divide-line text-sm">
          <div className="grid grid-cols-2 bg-mineral/30 py-2.5 px-4 font-semibold text-xs text-ink-muted">
            <div>In Drive</div>
            <div>On this device</div>
          </div>

          <div className="grid grid-cols-2 py-3 px-4 items-center">
            <div className="flex items-center gap-2 font-mono text-xs">
              <span>budget.xlsx</span>
              <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-[#FCE8E6] text-[#C5221F] flex items-center gap-0.5">
                <RefreshCw className="w-2.5 h-2.5" />
                Both
              </span>
            </div>
            <div className="font-mono text-xs text-ink">budget.xlsx</div>
          </div>

          <div className="grid grid-cols-2 py-3 px-4 items-center">
            <div className="font-mono text-xs text-ink">trip.pdf</div>
            <div className="font-mono text-xs text-ink">notes.csv</div>
          </div>
        </div>

        {/* Primary Safe Resolution Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onPullKeepDrive}
            className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium bg-vault-green text-white hover:bg-vault-hover transition shadow-sm"
          >
            Pull and keep Drive's
          </button>

          <button
            onClick={onKeepBoth}
            className="py-2.5 px-4 rounded-xl text-sm font-medium border border-line hover:bg-mineral/40 text-ink transition"
          >
            Keep both
          </button>

          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl text-sm font-medium border border-line hover:bg-mineral/40 text-ink-muted hover:text-ink transition"
          >
            Cancel
          </button>
        </div>

        {/* Guarded Force Push Action (PRD FR-04 Safety Rail) */}
        <div className="pt-4 border-t border-line flex items-center gap-3">
          <input
            type="text"
            placeholder="Type PUSH"
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            className="flex-1 py-2 px-3.5 rounded-xl border border-line text-sm text-ink placeholder:text-ink-muted/70 focus:outline-none focus:border-danger font-mono"
          />

          <button
            onClick={onForcePush}
            disabled={!isForcePushAllowed}
            className={`py-2 px-4 rounded-xl text-sm font-medium text-white transition ${
              isForcePushAllowed
                ? "bg-danger hover:bg-danger-hover cursor-pointer"
                : "bg-danger/40 cursor-not-allowed opacity-60"
            }`}
          >
            Force push, keep mine
          </button>
        </div>
      </div>
    </div>
  );
};
