import React, { useState } from "react";
import { Lock, ShieldCheck } from "lucide-react";

interface UnlockViewProps {
  workspaceName: string;
  accountEmail: string;
  version: number;
  onUnlock: (passwordOrRecoveryKey: string) => Promise<boolean>;
  onCreateNewWorkspace: () => void;
}

export const UnlockView: React.FC<UnlockViewProps> = ({
  workspaceName,
  accountEmail,
  version,
  onUnlock,
  onCreateNewWorkspace,
}) => {
  const [password, setPassword] = useState("");
  const [useRecoveryKey, setUseRecoveryKey] = useState(false);
  const [recoveryPhrase, setRecoveryPhrase] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    try {
      const token = useRecoveryKey ? recoveryPhrase.trim() : password;
      const success = await onUnlock(token);
      if (!success) {
        setErrorMsg(
          useRecoveryKey
            ? "Invalid 24-word recovery phrase. Check for typos."
            : "Incorrect master password."
        );
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Unlock failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex select-none">
      {/* Left Security Hero Panel */}
      <div className="hidden lg:flex w-5/12 bg-rail text-ink-light flex-col justify-between p-12 border-r border-line-dark/40">
        <div>
          <div className="flex items-center gap-2.5 text-white font-semibold text-lg">
            <span className="w-3 h-3 rounded-full bg-vault-mint inline-block" />
            SecureWorkspace
          </div>

          <div className="mt-24 space-y-6">
            <div className="w-16 h-16 rounded-full border-2 border-vault-mint/40 flex items-center justify-center text-vault-mint font-bold text-lg bg-vault-mint/10">
              v{version}
            </div>

            <h1 className="text-3xl font-bold text-white tracking-tight leading-snug">
              Zero knowledge.<br />
              Google cannot read your files.
            </h1>

            <p className="text-ink-light/70 text-sm leading-relaxed max-w-sm">
              All files and directory paths remain encrypted at rest with libsodium XChaCha20-Poly1305 and Argon2id. Keys never leave this device.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-ink-light/50">
          <ShieldCheck className="w-4 h-4 text-vault-mint" />
          Hardware & memory-bounded zero-plaintext architecture
        </div>
      </div>

      {/* Right Unlock Form Panel */}
      <div className="flex-1 bg-surface flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-md space-y-8 bg-surface-card p-10 rounded-2xl border border-line shadow-sm">
          {/* Header */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1">
              Encrypted Workspace
            </div>
            <h2 className="text-2xl font-bold text-ink">
              Unlock {workspaceName}
            </h2>
            <p className="text-xs text-ink-muted mt-1">
              Connected as {accountEmail}
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-danger-subtle text-danger text-xs font-medium rounded-lg border border-danger/20">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!useRecoveryKey ? (
              <div>
                <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">
                  Master Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    autoFocus
                    placeholder="Enter your master password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full py-2.5 px-3.5 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:border-vault-green"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">
                  24-Word Recovery Phrase
                </label>
                <textarea
                  autoFocus
                  rows={3}
                  placeholder="Paste or type all 24 words separated by spaces..."
                  value={recoveryPhrase}
                  onChange={(e) => setRecoveryPhrase(e.target.value)}
                  className="w-full py-2.5 px-3.5 rounded-xl border border-line bg-surface text-ink text-sm font-mono focus:outline-none focus:border-vault-green"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || (!password && !recoveryPhrase)}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-medium bg-vault-green text-white hover:bg-vault-hover transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              {isLoading ? "Deriving keys..." : "Unlock"}
            </button>
          </form>

          {/* Alternate Recovery Link */}
          <div className="pt-2 text-center text-xs space-y-3">
            <button
              type="button"
              onClick={() => {
                setUseRecoveryKey(!useRecoveryKey);
                setErrorMsg("");
              }}
              className="text-vault-green hover:underline font-medium"
            >
              {useRecoveryKey ? "Use password instead" : "Use recovery key instead"}
            </button>

            <div className="pt-4 border-t border-line text-ink-muted">
              Need a new workspace?{" "}
              <button
                onClick={onCreateNewWorkspace}
                className="text-vault-green hover:underline font-medium"
              >
                Create workspace
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
