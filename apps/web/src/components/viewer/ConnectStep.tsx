import React, { useState } from 'react';
import { requestGoogleDriveAccess } from '../../drive/auth';
import { discoverAllVaults } from '../../drive/vault-discovery';
import { useAuthStore } from '../../store/useAuthStore';
import { useVaultStore } from '../../store/useVaultStore';
import { Loader2, AlertCircle, Download, RefreshCw, ArrowLeft, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ConnectStep: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noVaultFound, setNoVaultFound] = useState(false);
  const { setAuth, disconnect, userEmail, isAuthenticated } = useAuthStore();
  const { setVault, reset } = useVaultStore();

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    setNoVaultFound(false);

    try {
      // 1. Trigger Google Identity Services OAuth popup
      const { accessToken, user } = await requestGoogleDriveAccess();
      setAuth(accessToken, user);

      // 2. Discover all vaults in Drive
      const vaults = await discoverAllVaults(accessToken);
      useVaultStore.getState().setAvailableVaults(vaults);

      if (vaults.length === 1) {
        setVault(vaults[0]);
      } else if (vaults.length === 0) {
        setNoVaultFound(true);
      }
    } catch (err) {
      console.error('Drive connection error:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchAccount = () => {
    setNoVaultFound(false);
    setError(null);
    reset();
    disconnect();
  };

  // Dedicated First-Time Cloud Onboarding view when user signs in with Google but hasn't created a vault on desktop yet
  if (noVaultFound || (isAuthenticated && useVaultStore.getState().availableVaults.length === 0)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-20 animate-in fade-in duration-200">
        <div className="max-w-lg w-full mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={handleSwitchAccount}
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
            <div className="font-mono text-xs font-semibold uppercase tracking-wider text-amber-800 bg-amber-100/70 inline-block px-2.5 py-0.5 rounded mb-3">
              FIRST-TIME SETUP · NO VAULT IN DRIVE
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#14201C] tracking-tight mb-2">
              No Encrypted Vault Found
            </h1>
            <p className="text-sm text-[#5A6662] leading-relaxed">
              Google Drive currently has no encrypted <code className="bg-[#EDF0ED] px-1 py-0.5 rounded text-xs font-mono">SecureWorkspace</code> vault. Because files are encrypted locally on your computer before touching Google Drive, you must push your vault from the desktop app first.
            </p>
          </div>

          {/* 3-Step Guide */}
          <div className="space-y-3 pt-1">
            <div className="p-3.5 rounded-xl bg-[#F8FAF8] border border-[#E2E6E3] flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#0F5C4D] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
              <div>
                <h2 className="text-xs font-bold text-[#14201C]">Install Desktop App</h2>
                <p className="text-[11px] text-[#5A6662] mt-0.5">Download and install SecureWorkspace for Windows.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAF8] border border-[#E2E6E3] flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#0F5C4D] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
              <div>
                <h2 className="text-xs font-bold text-[#14201C]">Create Vault &amp; Add Files</h2>
                <p className="text-[11px] text-[#5A6662] mt-0.5">Set a master password, save your 24-word recovery key, and place files in your vault folder.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAF8] border border-[#E2E6E3] flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#0F5C4D] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
              <div>
                <h2 className="text-xs font-bold text-[#14201C]">Click "Push to Drive"</h2>
                <p className="text-[11px] text-[#5A6662] mt-0.5">Upload encrypted blocks to Drive. Once uploaded, they will appear here instantly for read-only access.</p>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-3 pt-2">
            <a
              href="/#download"
              className="block w-full"
            >
              <button className="w-full bg-[#0F5C4D] hover:bg-[#0C4B3E] active:bg-[#09392F] text-white py-3.5 px-4 rounded-lg font-medium text-sm transition-all duration-150 cursor-pointer shadow-xs flex items-center justify-center gap-2">
                <Download className="w-4 h-4" />
                <span>Download Desktop App for Windows</span>
              </button>
            </a>

            <button
              onClick={handleConnect}
              disabled={loading}
              className="w-full bg-white hover:bg-[#F8FAF8] border border-[#CAD2CD] text-[#14201C] py-3 px-4 rounded-lg font-medium text-sm transition-all duration-150 cursor-pointer shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#0F5C4D]' : ''}`} />
              <span>I've pushed from desktop, check again</span>
            </button>
          </div>

          <div className="pt-2 border-t border-[#E2E6E3] flex items-center justify-between text-xs text-[#5A6662]">
            <Link to="/docs#quick-start" className="text-[#0F5C4D] hover:underline flex items-center gap-1 font-medium">
              <span>Read Quick Start Guide</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
            <button
              onClick={handleSwitchAccount}
              className="hover:text-[#14201C] cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

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
                <span className="font-bold">Connection notice</span>
                <p className="leading-relaxed text-amber-900/90">{error}</p>
              </div>
            </div>
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
