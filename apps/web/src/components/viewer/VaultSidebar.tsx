import React from 'react';
import { useVaultStore } from '../../store/useVaultStore';
import { useSecurityStore, formatRemainingTime } from '../../store/useSecurityStore';
import { Files, History, Lock, X } from 'lucide-react';

interface VaultSidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const VaultSidebar: React.FC<VaultSidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const vault = useVaultStore((s) => s.vault);
  const availableVaults = useVaultStore((s) => s.availableVaults);
  const activeTab = useVaultStore((s) => s.activeTab);
  const setActiveTab = useVaultStore((s) => s.setActiveTab);
  const lockVault = useVaultStore((s) => s.lockVault);
  const remainingSeconds = useSecurityStore((s) => s.remainingSeconds);

  const vaultName = vault?.folderName || 'Personal';

  const content = (
    <div className="h-full flex flex-col justify-between p-6 text-white select-none">
      {/* Top Section */}
      <div className="space-y-8">
        {/* Vault Title & Multi-Workspace Switcher */}
        <div className="flex items-center justify-between">
          <div className="truncate">
            <h2 className="text-xl font-bold tracking-tight text-white truncate">
              {vaultName}
            </h2>
            {availableVaults.length > 1 && (
              <button
                type="button"
                onClick={async () => {
                  await lockVault();
                  useVaultStore.setState({ vault: null });
                }}
                className="text-[11px] text-[#3FB89A] hover:underline cursor-pointer flex items-center gap-1 mt-0.5"
              >
                <span>Switch workspace ({availableVaults.length})</span>
              </button>
            )}
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-[#8E9A96] hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="space-y-1.5">
          <button
            onClick={() => {
              setActiveTab('files');
              setMobileOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer text-left ${
              activeTab === 'files'
                ? 'bg-[#183B32] text-white shadow-xs'
                : 'text-[#9AA5A1] hover:text-white hover:bg-[#122822]'
            }`}
          >
            <Files className="w-4 h-4 shrink-0" />
            <span>Files</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('versions');
              setMobileOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer text-left ${
              activeTab === 'versions'
                ? 'bg-[#183B32] text-white shadow-xs'
                : 'text-[#9AA5A1] hover:text-white hover:bg-[#122822]'
            }`}
          >
            <History className="w-4 h-4 shrink-0" />
            <span>Versions</span>
          </button>
        </nav>
      </div>

      {/* Bottom Section: Auto-lock & Lock Button */}
      <div className="space-y-3 pt-6 border-t border-[#183B32]/60">
        <div className="text-xs font-mono text-[#9AA5A1] flex items-center gap-2">
          <span>Auto-locks in {formatRemainingTime(remainingSeconds)}</span>
        </div>

        <button
          onClick={() => lockVault()}
          className="w-full bg-white hover:bg-[#F2F4F2] active:bg-[#E5E8E5] text-[#14201C] py-2.5 px-4 rounded-lg font-semibold text-sm transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-2"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Lock</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (persistent) */}
      <aside className="hidden md:flex w-64 bg-[#0A1612] shrink-0 border-r border-[#152B24] flex-col">
        {content}
      </aside>

      {/* Mobile Drawer (overlay) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-[#0A1612] shadow-2xl z-10">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
