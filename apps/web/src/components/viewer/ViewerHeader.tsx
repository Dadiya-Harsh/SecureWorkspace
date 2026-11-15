import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useVaultStore } from '../../store/useVaultStore';
import { LogOut } from 'lucide-react';

export const ViewerHeader: React.FC = () => {
  const { userEmail, isAuthenticated, disconnect } = useAuthStore();
  const { vault, reset } = useVaultStore();

  const handleDisconnect = () => {
    reset();
    disconnect();
  };

  const hasActiveSession = isAuthenticated || Boolean(vault);

  return (
    <header className="w-full bg-[#EDF0ED] border-b border-[#E2E6E3]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Header */}
        <Link
          to="/"
          className="text-base sm:text-lg font-bold tracking-tight text-[#14201C] hover:text-[#0F5C4D] transition-colors"
        >
          SecureWorkspace viewer
        </Link>

        {/* Right Info: Read-Only Badge or Connected User */}
        <div className="flex items-center gap-3">
          {hasActiveSession ? (
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-[#5A6662] bg-[#E2E6E3]/60 px-3 py-1 rounded-md border border-[#CAD2CD]/60 truncate max-w-[200px] sm:max-w-none">
                [{userEmail || vault?.folderName}]
              </span>
              <button
                onClick={handleDisconnect}
                className="text-[#5A6662] hover:text-[#9B2F1F] p-1 rounded transition-colors cursor-pointer flex items-center gap-1 text-xs"
                title="Disconnect Google Drive / Reset"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Disconnect</span>
              </button>
            </div>
          ) : (
            <span className="font-mono text-xs text-[#5A6662] bg-[#E2E6E3]/60 px-3 py-1 rounded-md border border-[#CAD2CD]/60">
              - Read-only
            </span>
          )}
        </div>
      </div>
    </header>
  );
};
