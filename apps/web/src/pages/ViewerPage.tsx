import React, { useState } from 'react';
import { ViewerHeader } from '../components/viewer/ViewerHeader';
import { ConnectStep } from '../components/viewer/ConnectStep';
import { WorkspaceSelectStep } from '../components/viewer/WorkspaceSelectStep';
import { UnlockStep } from '../components/viewer/UnlockStep';
import { VaultSidebar } from '../components/viewer/VaultSidebar';
import { FileTable } from '../components/viewer/FileTable';
import { DocumentViewerHost } from '../components/viewers/DocumentViewerHost';
import { VersionHistory } from '../components/viewer/VersionHistory';
import { AutoLockManager } from '../components/viewer/AutoLockManager';
import { useVaultStore } from '../store/useVaultStore';
import { Menu } from 'lucide-react';

export const ViewerPage: React.FC = () => {
  const { vault, availableVaults, isUnlocked, selectedFile, activeTab } = useVaultStore();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#EDF0ED] flex flex-col selection:bg-[#DCECE6] selection:text-[#0F5C4D]">
      {/* Background inactivity auto-lock daemon */}
      <AutoLockManager />

      {!isUnlocked ? (
        // Connect & Unlock Steps (Screen 2 & Screen 3)
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <ViewerHeader />
            <main className="flex-1 flex flex-col">
              {!vault && availableVaults.length > 1 && <WorkspaceSelectStep />}
              {!vault && availableVaults.length <= 1 && <ConnectStep />}
              {vault && <UnlockStep />}
            </main>
          </div>
        </div>
      ) : (
        // Unlocked Vault Interface (Screen 4: File Explorer & Screen 5: Document Viewer)
        <div className="flex-1 flex flex-col md:flex-row min-h-screen">
          {/* Mobile Top Bar to toggle sidebar */}
          <div className="md:hidden bg-[#0A1612] text-white px-4 py-3 flex items-center justify-between border-b border-[#152B24]">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-1.5 rounded-lg hover:bg-[#152B24] text-[#8E9A96] hover:text-white transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-bold text-sm tracking-tight">
              {vault?.folderName || 'SecureVault'}
            </span>
            <div className="w-8" />
          </div>

          {/* Left Sidebar matching mockup */}
          <VaultSidebar
            mobileOpen={mobileSidebarOpen}
            setMobileOpen={setMobileSidebarOpen}
          />

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col min-h-full">
            {selectedFile ? (
              <DocumentViewerHost />
            ) : activeTab === 'versions' ? (
              <VersionHistory />
            ) : (
              <FileTable />
            )}
          </main>
        </div>
      )}
    </div>
  );
};
