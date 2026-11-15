import React, { useState } from 'react';
import { requestGoogleDriveAccess } from '../../drive/auth';
import { discoverAllVaults } from '../../drive/vault-discovery';
import { useAuthStore } from '../../store/useAuthStore';
import { useVaultStore } from '../../store/useVaultStore';
import { Loader2, AlertCircle, HelpCircle } from 'lucide-react';

export const ConnectStep: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setAuth = useAuthStore((s) => s.setAuth);
  const setVault = useVaultStore((s) => s.setVault);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Trigger Google Identity Services OAuth popup
      const { accessToken, user } = await requestGoogleDriveAccess();
      setAuth(accessToken, user);

      // 2. Discover all vaults in Drive
      const vaults = await discoverAllVaults(accessToken);
      useVaultStore.getState().setAvailableVaults(vaults);

      if (vaults.length === 1) {
        setVault(vaults[0]);
      }
    } catch (err) {
      console.error('Drive connection error:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const isNoVaultError = error?.includes('workspace.header');

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 sm:py-20">
      <div className="bg-white rounded-2xl p-7 sm:p-10 border border-[#E2E6E3] shadow-xs max-w-lg w-full">
        {/* Step Indicator */}
        <div className="font-mono text-xs font-semibold uppercase tracking-wider text-[#5A6662] mb-4">
          STEP 1 OF 2
        </div>

        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#14201C] tracking-tight mb-4">
          Connect your Google Drive
        </h1>

        {/* Explainer */}
        <p className="text-sm text-[#5A6662] leading-relaxed mb-6">
          The page asks only for access to files the app created. Your files are
          decrypted in this browser tab and never sent to us.
        </p>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-950 text-xs space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold">
                  {isNoVaultError ? 'Vault not found in Google Drive' : 'Connection notice'}
                </span>
                <p className="leading-relaxed text-amber-900/90">{error}</p>
              </div>
            </div>

            {isNoVaultError && (
              <div className="pt-2 border-t border-amber-200/60 space-y-2 text-[11px] text-amber-900">
                <div className="flex items-center gap-1 font-semibold text-amber-950">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>How to sync your desktop vault to Google Drive:</span>
                </div>
                <ol className="list-decimal pl-4 space-y-1 text-amber-900/90">
                  <li>Open the <strong>SecureWorkspace Desktop app</strong> on your computer.</li>
                  <li>Click <strong>Push</strong> (in the top bar or Sync tab) to push your local vault to Google Drive.</li>
                  <li>Once pushed, return here and click <strong>Continue with Google</strong> again.</li>
                </ol>
              </div>
            )}
          </div>
        )}

        {/* Primary Action Button */}
        <button
          onClick={handleConnect}
          disabled={loading}
          className="w-full bg-[#0F5C4D] hover:bg-[#0C4B3E] active:bg-[#09392F] text-white py-3.5 px-4 rounded-lg font-medium text-sm transition-all duration-150 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#3FB89A]" />
              <span>Connecting to Google Drive...</span>
            </>
          ) : (
            <span>Continue with Google</span>
          )}
        </button>

        {/* Bottom Sub-note */}
        <p className="text-xs text-[#8E9A96] leading-relaxed mt-6">
          You may be asked to pick the SecureWorkspace folder. Changes are made in
          the desktop app.
        </p>
      </div>
    </div>
  );
};
