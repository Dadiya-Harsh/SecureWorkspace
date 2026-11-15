import React, { useState } from 'react';
import { useVaultStore } from '../../store/useVaultStore';
import { useAuthStore } from '../../store/useAuthStore';
import { cryptoClient } from '../../crypto/worker/crypto-client';
import { Loader2, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export const UnlockStep: React.FC = () => {
  const { vault, availableVaults, setUnlocked, reset } = useVaultStore();
  const disconnect = useAuthStore((s) => s.disconnect);

  const [mode, setMode] = useState<'password' | 'recovery'>('password');
  const [password, setPassword] = useState('');
  const [recoveryPhrase, setRecoveryPhrase] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!vault) {
    return null;
  }

  const handleBack = () => {
    if (availableVaults.length > 1) {
      useVaultStore.setState({ vault: null });
    } else {
      reset();
      disconnect();
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'password') {
        if (!password.trim()) {
          throw new Error('Please enter your master password.');
        }

        // 1. Derive KEK via Argon2id inside Web Worker and unwrap WMK
        await cryptoClient.unlockWithPassword(vault.headerBytes, password.trim());
      } else {
        if (!recoveryPhrase.trim()) {
          throw new Error('Please enter your 24-word recovery phrase.');
        }

        // 1. Derive KEK from recovery entropy and unwrap WMK
        await cryptoClient.unlockWithRecoveryPhrase(vault.headerBytes, recoveryPhrase.trim());
      }

      // 2. Decrypt manifest if available
      if (vault.manifestBytes && vault.manifestBytes.length > 0) {
        const manifest = await cryptoClient.decryptManifest(vault.manifestBytes);
        setUnlocked(manifest);
      } else {
        // Vault has no manifest or 0 files pushed yet
        setUnlocked({
          format: 'SecureWorkspaceManifest_v1',
          version_number: vault.remoteHeadVersion,
          manifest_id: 'empty',
          timestamp_ms: Date.now(),
          device_id: vault.pushedFromDevice,
          message: 'Initial vault state',
          entries: [],
        });
      }
    } catch (err) {
      console.error('Unlock error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Authentication failed: incorrect password or corrupted vault header.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-20">
      <div className="max-w-lg w-full mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-xs text-[#5A6662] hover:text-[#14201C] cursor-pointer font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>
            {availableVaults.length > 1
              ? 'Back to Workspace Selection'
              : 'Back to Step 1 (Connect Google Drive)'}
          </span>
        </button>
      </div>

      <div className="bg-white rounded-2xl p-7 sm:p-10 border border-[#E2E6E3] shadow-xs max-w-lg w-full">
        {/* Step Indicator */}
        <div className="font-mono text-xs font-semibold uppercase tracking-wider text-[#5A6662] mb-4">
          STEP 2 OF 2
        </div>

        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#14201C] tracking-tight mb-2">
          Unlock {vault.folderName}
        </h1>

        {/* Subtitle with version & device */}
        <p className="text-sm text-[#5A6662] mb-6">
          Version {vault.remoteHeadVersion}, pushed from {vault.pushedFromDevice}.
        </p>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200/80 text-red-900 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">Unlock failed:</span>
              <p className="leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleUnlock} className="space-y-6">
          {mode === 'password' ? (
            <div>
              <label
                htmlFor="master-password"
                className="block text-sm font-bold text-[#14201C] mb-2"
              >
                Master password
              </label>
              <div className="relative">
                <input
                  id="master-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your master password"
                  autoFocus
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-lg border border-[#CAD2CD] focus:border-[#0F5C4D] focus:ring-1 focus:ring-[#0F5C4D] outline-none text-sm font-medium text-[#14201C] transition-colors pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#5A6662] hover:text-[#14201C] transition-colors cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <label
                htmlFor="recovery-phrase"
                className="block text-sm font-bold text-[#14201C] mb-2"
              >
                24-word recovery phrase
              </label>
              <textarea
                id="recovery-phrase"
                rows={3}
                value={recoveryPhrase}
                onChange={(e) => setRecoveryPhrase(e.target.value)}
                placeholder="abandon abandon abandon abandon ... art"
                autoFocus
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg border border-[#CAD2CD] focus:border-[#0F5C4D] focus:ring-1 focus:ring-[#0F5C4D] outline-none text-xs font-mono text-[#14201C] transition-colors resize-none leading-relaxed"
              />
            </div>
          )}

          {/* Unlock Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0F5C4D] hover:bg-[#0C4B3E] active:bg-[#09392F] text-white py-3.5 px-4 rounded-lg font-medium text-sm transition-all duration-150 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#3FB89A]" />
                <span>Deriving key with Argon2id...</span>
              </>
            ) : (
              <span>Unlock</span>
            )}
          </button>
        </form>

        {/* Alternate Option: Use recovery phrase instead */}
        <div className="mt-5">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'password' ? 'recovery' : 'password');
              setError(null);
            }}
            className="text-sm font-medium text-[#0F5C4D] hover:underline cursor-pointer"
          >
            {mode === 'password'
              ? 'Use recovery phrase instead'
              : 'Use master password instead'}
          </button>
        </div>

        {/* Security Advisory */}
        <p className="text-xs text-[#8E9A96] leading-relaxed mt-6">
          Unlocking takes a few seconds: the key is derived in your browser. Use
          this only on a device you trust.
        </p>

        {/* Bottom Switch Account Option */}
        <div className="mt-6 pt-4 border-t border-[#E2E6E3] flex items-center justify-between text-xs text-[#5A6662]">
          <span>Need to switch account or vault?</span>
          <button
            type="button"
            onClick={handleBack}
            className="font-semibold text-[#0F5C4D] hover:underline cursor-pointer"
          >
            {availableVaults.length > 1 ? 'Switch Workspace' : 'Disconnect / Step 1'}
          </button>
        </div>
      </div>
    </div>
  );
};
