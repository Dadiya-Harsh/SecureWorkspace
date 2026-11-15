import React from 'react';
import { useVaultStore } from '../../store/useVaultStore';
import { useAuthStore } from '../../store/useAuthStore';
import type { DiscoveredVault } from '../../drive/vault-discovery';
import { FolderLock, ChevronRight, ArrowLeft, ShieldCheck } from 'lucide-react';

export const WorkspaceSelectStep: React.FC = () => {
  const availableVaults = useVaultStore((s) => s.availableVaults);
  const selectVault = useVaultStore((s) => s.selectVault);
  const reset = useVaultStore((s) => s.reset);
  const disconnect = useAuthStore((s) => s.disconnect);
  const userEmail = useAuthStore((s) => s.userEmail);

  const handleBackToConnect = () => {
    reset();
    disconnect();
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-20">
      <div className="max-w-lg w-full mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={handleBackToConnect}
          className="inline-flex items-center gap-1.5 text-xs text-[#5A6662] hover:text-[#14201C] cursor-pointer font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Switch Google Account</span>
        </button>

        {userEmail && (
          <span className="text-[11px] font-mono text-[#5A6662] bg-[#E2E6E3] px-2.5 py-0.5 rounded font-medium">
            {userEmail}
          </span>
        )}
      </div>

      <div className="bg-white rounded-2xl p-7 sm:p-10 border border-[#E2E6E3] shadow-xs max-w-lg w-full space-y-6">
        <div>
          {/* Step Indicator */}
          <div className="font-mono text-xs font-semibold uppercase tracking-wider text-[#5A6662] mb-3">
            STEP 1 OF 2 · SELECT WORKSPACE
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#14201C] tracking-tight mb-2">
            Select a Workspace
          </h1>

          <p className="text-sm text-[#5A6662]">
            Found {availableVaults.length} encrypted workspaces in your Google Drive. Pick one to unlock in this session:
          </p>
        </div>

        {/* Workspaces List */}
        <div className="space-y-3 pt-2">
          {availableVaults.map((vault: DiscoveredVault) => (
            <button
              key={vault.folderId}
              type="button"
              onClick={() => selectVault(vault)}
              className="w-full text-left p-4 rounded-xl border border-[#D5DDD7] hover:border-[#0F5C4D] hover:bg-[#F8FAF8] transition-all duration-150 cursor-pointer flex items-center justify-between group shadow-2xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#E6F4F1] text-[#0F5C4D] flex items-center justify-center shrink-0 group-hover:bg-[#0F5C4D] group-hover:text-white transition-colors">
                  <FolderLock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#14201C] group-hover:text-[#0F5C4D] transition-colors">
                      {vault.folderName}
                    </span>
                    <span className="px-2 py-0.2 rounded text-[11px] font-semibold bg-[#E2E6E3] text-[#5A6662]">
                      v{vault.remoteHeadVersion}
                    </span>
                  </div>
                  <div className="text-xs text-[#8E9A96] flex items-center gap-1.5 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0F5C4D]" />
                    <span>Pushed from {vault.pushedFromDevice}</span>
                  </div>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-[#8E9A96] group-hover:text-[#0F5C4D] group-hover:translate-x-0.5 transition-all" />
            </button>
          ))}
        </div>

        {/* Security Note */}
        <p className="text-xs text-[#8E9A96] leading-relaxed pt-2 border-t border-[#E2E6E3]">
          Each workspace has an independent encryption key. Your master password decrypts only the chosen workspace.
        </p>
      </div>
    </div>
  );
};
