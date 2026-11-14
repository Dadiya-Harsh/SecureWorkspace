import React, { useState } from "react";
import { Lock, ShieldCheck, ChevronDown, FolderOpen, Plus } from "lucide-react";
import { RegisteredWorkspace } from "../api/types";

interface UnlockViewProps {
  workspaceName: string;
  accountEmail: string;
  version: number;
  registeredWorkspaces?: RegisteredWorkspace[];
  onUnlock: (passwordOrRecoveryKey: string) => Promise<boolean>;
  onCreateNewWorkspace: () => void;
  onSelectWorkspace?: (ws: RegisteredWorkspace) => void;
  onOpenExistingWorkspace?: () => void;
}

export const UnlockView: React.FC<UnlockViewProps> = ({
  workspaceName,
  accountEmail,
  version,
  registeredWorkspaces = [],
  onUnlock,
  onCreateNewWorkspace,
  onSelectWorkspace,
  onOpenExistingWorkspace,
}) => {
  const [password, setPassword] = useState("");
  const [useRecoveryKey, setUseRecoveryKey] = useState(false);
  const [recoveryPhrase, setRecoveryPhrase] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitchingWorkspace, setIsSwitchingWorkspace] = useState(false);

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
          {/* Header & Workspace Switcher Trigger */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                Encrypted Workspace
              </span>
              {registeredWorkspaces.length > 1 && onSelectWorkspace && (
                <button
                  type="button"
                  onClick={() => setIsSwitchingWorkspace(!isSwitchingWorkspace)}
                  className="text-xs font-semibold text-vault-green hover:underline flex items-center gap-1"
                >
                  Switch Vault <ChevronDown className="w-3 h-3" />
                </button>
              )}
            </div>

            <h2 className="text-2xl font-bold text-ink">
              Unlock {workspaceName}
            </h2>
            <p className="text-xs text-ink-muted">
              Connected as {accountEmail}
            </p>

            {/* Switcher selector dropdown */}
            {isSwitchingWorkspace && registeredWorkspaces.length > 0 && (
              <div className="mt-3 p-2 bg-mineral/50 border border-line rounded-xl space-y-1 animate-in fade-in zoom-in-95">
                <div className="text-[10px] font-bold uppercase text-ink-muted px-2 py-1">
                  Select a Workspace to Unlock
                </div>
                {registeredWorkspaces.map((ws) => (
                  <button
                    key={ws.path}
                    type="button"
                    onClick={() => {
                      setIsSwitchingWorkspace(false);
                      if (onSelectWorkspace) onSelectWorkspace(ws);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition ${
                      ws.name === workspaceName
                        ? "bg-vault-green text-white font-bold"
                        : "hover:bg-mineral text-ink"
                    }`}
                  >
                    <div className="truncate">{ws.name}</div>
                    <div className="text-[10px] opacity-75 font-mono truncate">{ws.path}</div>
                  </button>
                ))}
              </div>
            )}
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
              {isLoading ? "Deriving keys with Argon2id..." : "Unlock"}
            </button>
          </form>

          {/* Alternate Recovery Link & Actions */}
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

            <div className="pt-4 border-t border-line flex items-center justify-between text-ink-muted">
              <button
                type="button"
                onClick={onCreateNewWorkspace}
                className="text-vault-green hover:underline font-medium flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> New workspace
              </button>

              {onOpenExistingWorkspace && (
                <button
                  type="button"
                  onClick={onOpenExistingWorkspace}
                  className="text-ink-muted hover:text-ink hover:underline font-medium flex items-center gap-1"
                >
                  <FolderOpen className="w-3.5 h-3.5" /> Open folder
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
