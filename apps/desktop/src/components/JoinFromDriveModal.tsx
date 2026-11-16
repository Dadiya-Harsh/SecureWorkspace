import React, { useState, useEffect } from "react";
import {
  X,
  Cloud,
  FolderOpen,
  Lock,
  AlertCircle,
  Loader2,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { api } from "../api/client";
import { RemoteVaultItem, JoinWorkspaceResult } from "../api/types";
import { useToast } from "../context/ToastContext";

interface JoinFromDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: JoinWorkspaceResult) => void;
}

export const JoinFromDriveModal: React.FC<JoinFromDriveModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { toast } = useToast();

  const [step, setStep] = useState<"auth" | "select_vault" | "configure" | "joining">("auth");
  const [isDriveAuthed, setIsDriveAuthed] = useState(false);
  const [accountEmail, setAccountEmail] = useState("");
  const [loadingAuth, setLoadingAuth] = useState(false);

  const [vaults, setVaults] = useState<RemoteVaultItem[]>([]);
  const [selectedVault, setSelectedVault] = useState<RemoteVaultItem | null>(null);
  const [loadingVaults, setLoadingVaults] = useState(false);

  const [localPath, setLocalPath] = useState("");
  const [password, setPassword] = useState("");
  const [useRecoveryPhrase, setUseRecoveryPhrase] = useState(false);
  const [recoveryPhrase, setRecoveryPhrase] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  // Initialize and check Google Auth status upon open
  useEffect(() => {
    if (!isOpen) return;

    setStep("auth");
    setErrorMessage("");
    setPassword("");
    setRecoveryPhrase("");
    setUseRecoveryPhrase(false);

    api.googleAuthStatus().then(async (res) => {
      if (res.success && res.data?.authenticated) {
        setIsDriveAuthed(true);
        if (res.data.email) setAccountEmail(res.data.email);
        await scanVaults();
      } else {
        setIsDriveAuthed(false);
        setStep("auth");
      }
    });
  }, [isOpen]);

  const scanVaults = async () => {
    setLoadingVaults(true);
    setErrorMessage("");
    try {
      const res = await api.findRemoteVaults();
      if (res.success && res.data?.vaults) {
        setVaults(res.data.vaults);
        if (res.data.vaults.length > 0) {
          setSelectedVault(res.data.vaults[0]);
          setStep("configure");
        } else {
          setStep("select_vault");
        }
      } else {
        setStep("select_vault");
        setErrorMessage(res.message || "Failed to scan Google Drive.");
      }
    } catch (err: any) {
      setStep("select_vault");
      setErrorMessage(err?.message || "Failed to connect to Google Drive.");
    } finally {
      setLoadingVaults(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoadingAuth(true);
    setErrorMessage("");
    try {
      const res = await api.googleAuthLogin();
      if (res.success && res.data?.authenticated) {
        setIsDriveAuthed(true);
        if (res.data.email) setAccountEmail(res.data.email);
        toast.success(`Connected as ${res.data.email || "Google Account"}`);
        await scanVaults();
      } else {
        setErrorMessage(res.message || "Google authorization failed.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Could not launch Google sign-in.");
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleSwitchAccount = async () => {
    try {
      await api.googleAuthLogout();
      setIsDriveAuthed(false);
      setAccountEmail("");
      setVaults([]);
      setSelectedVault(null);
      setStep("auth");
      await handleGoogleLogin();
    } catch {
      setErrorMessage("Failed to switch Google account.");
    }
  };

  const handleBrowseFolder = async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select Local Folder for Joined Workspace",
      });
      if (selected && typeof selected === "string") {
        setLocalPath(selected);
      }
    } catch {
      const fallback = prompt(
        "Enter empty local destination folder path:",
        "C:\\Users\\User\\Documents\\SecureVault"
      );
      if (fallback) setLocalPath(fallback);
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localPath.trim()) {
      setErrorMessage("Please select an empty local destination folder.");
      return;
    }

    const token = useRecoveryPhrase ? recoveryPhrase.trim() : password;
    if (!token) {
      setErrorMessage(
        useRecoveryPhrase
          ? "Please enter your 24-word recovery phrase."
          : "Please enter your master password."
      );
      return;
    }

    setIsJoining(true);
    setErrorMessage("");

    try {
      const res = await api.joinFromDrive(
        localPath.trim(),
        token,
        selectedVault?.folder_name,
        selectedVault?.header_file_id
      );

      if (res.success && res.data) {
        toast.success(`✓ Joined workspace '${res.data.name}' from Google Drive!`);
        onSuccess(res.data);
        onClose();
      } else {
        if (res.error_code === "NO_REMOTE_VAULT_FOUND") {
          setErrorMessage(
            "No encrypted workspace.header found on Google Drive. Make sure you have pushed a vault from your primary computer first."
          );
        } else if (res.error_code === "WRONG_PASSWORD") {
          setErrorMessage(
            useRecoveryPhrase
              ? "Invalid 24-word recovery phrase. Check for typos or missing words."
              : "Incorrect master password for this vault."
          );
        } else {
          setErrorMessage(res.message || "Failed to join workspace.");
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to communicate with security daemon.");
    } finally {
      setIsJoining(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-in fade-in duration-150">
      <div className="bg-surface-card rounded-2xl border border-line shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-surface">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-vault-mint/15 text-vault-green flex items-center justify-center">
              <Cloud className="w-4 h-4 text-vault-green" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink">Join Existing Vault from Google Drive</h2>
              <p className="text-[11px] text-ink-muted">Set up an existing cloud workspace on this computer</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-black/5 transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Step 1: Google Auth Connection */}
          {!isDriveAuthed ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-mineral border border-line flex items-center justify-center mx-auto text-vault-green">
                <Cloud className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-ink">Connect to Google Drive</h3>
                <p className="text-xs text-ink-muted max-w-sm mx-auto">
                  Sign in with the Google account that contains your encrypted SecureWorkspace vault.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 bg-danger-subtle border border-danger/20 text-danger text-xs rounded-xl flex items-center gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loadingAuth}
                className="w-full py-3 px-4 rounded-xl font-semibold text-xs bg-vault-green text-white hover:bg-vault-hover transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loadingAuth ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting to Google...</span>
                  </>
                ) : (
                  <>
                    <span>Continue with Google</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          ) : step === "select_vault" && vaults.length === 0 ? (
            /* Empty Vault Edge Case */
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-200 flex items-center justify-center mx-auto text-amber-700">
                <AlertCircle className="w-6 h-6" />
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded">
                  No Vault Found in Drive
                </span>
                <h3 className="text-base font-bold text-ink mt-1">No Encrypted Vault Discovered</h3>
                <p className="text-xs text-ink-muted leading-relaxed max-w-sm mx-auto">
                  Connected as <strong>{accountEmail}</strong>, but no <code className="bg-mineral px-1 rounded font-mono">workspace.header</code> was found in Google Drive.
                </p>
              </div>

              <div className="p-3.5 bg-mineral/50 border border-line rounded-xl text-xs text-left text-ink-muted space-y-1.5">
                <div className="font-bold text-ink text-[11px] uppercase tracking-wider">How to resolve:</div>
                <p>1. Ensure you pushed from your primary computer using the desktop app.</p>
                <p>2. If you used a different Google account, switch accounts below.</p>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleSwitchAccount}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-line hover:bg-mineral text-xs font-semibold text-ink transition"
                >
                  Switch Google Account
                </button>
                <button
                  type="button"
                  onClick={scanVaults}
                  disabled={loadingVaults}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-vault-green text-white hover:bg-vault-hover text-xs font-semibold transition flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingVaults ? "animate-spin" : ""}`} />
                  <span>Check Again</span>
                </button>
              </div>
            </div>
          ) : (
            /* Configure & Unlock Step */
            <form onSubmit={handleJoinSubmit} className="space-y-4">
              {/* Connected Account & Vault Badge */}
              <div className="p-3 bg-mineral/40 border border-line rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-ink-muted">Account:</span>
                  <span className="font-semibold text-ink">{accountEmail}</span>
                  <button
                    type="button"
                    onClick={handleSwitchAccount}
                    className="text-[11px] text-vault-green hover:underline ml-1"
                  >
                    (Switch)
                  </button>
                </div>
                {selectedVault && (
                  <span className="font-mono text-[11px] text-vault-green bg-vault-mint/15 px-2 py-0.5 rounded font-bold">
                    {selectedVault.folder_name}
                  </span>
                )}
              </div>

              {/* Local Folder Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-ink uppercase tracking-wider">
                  Local Folder Location
                </label>
                <p className="text-[11px] text-ink-muted">
                  Choose an empty directory on this computer where your decrypted files will live:
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={localPath}
                    onChange={(e) => setLocalPath(e.target.value)}
                    placeholder="C:\Users\...\Documents\MyVault"
                    className="flex-1 py-2 px-3 rounded-xl border border-line bg-surface text-xs font-mono text-ink focus:outline-none focus:border-vault-green"
                  />
                  <button
                    type="button"
                    onClick={handleBrowseFolder}
                    className="px-3 py-2 rounded-xl border border-line bg-surface hover:bg-mineral transition text-xs font-semibold text-ink flex items-center gap-1.5 shrink-0"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-vault-green" />
                    <span>Browse</span>
                  </button>
                </div>
              </div>

              {/* Password or Recovery Phrase Toggle */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-ink uppercase tracking-wider">
                    {useRecoveryPhrase ? "24-Word Recovery Phrase" : "Master Password"}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setUseRecoveryPhrase(!useRecoveryPhrase);
                      setErrorMessage("");
                    }}
                    className="text-[11px] font-semibold text-vault-green hover:underline cursor-pointer"
                  >
                    {useRecoveryPhrase ? "Use master password instead" : "Use 24-word recovery phrase instead"}
                  </button>
                </div>

                {!useRecoveryPhrase ? (
                  <div className="relative">
                    <input
                      type="password"
                      autoFocus
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter the master password for this vault"
                      className="w-full py-2.5 px-3 rounded-xl border border-line bg-surface text-xs text-ink focus:outline-none focus:border-vault-green"
                    />
                  </div>
                ) : (
                  <div>
                    <textarea
                      rows={3}
                      autoFocus
                      value={recoveryPhrase}
                      onChange={(e) => setRecoveryPhrase(e.target.value)}
                      placeholder="abandon ability able about above absent absorb abstract absurd abuse access accident..."
                      className="w-full py-2 px-3 rounded-xl border border-line bg-surface text-xs font-mono text-ink focus:outline-none focus:border-vault-green"
                    />
                    <p className="text-[10px] text-ink-muted mt-0.5">
                      Enter all 24 words in lowercase, separated by spaces.
                    </p>
                  </div>
                )}
              </div>

              {errorMessage && (
                <div className="p-3 bg-danger-subtle border border-danger/20 text-danger text-xs rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{errorMessage}</span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-line hover:bg-mineral text-xs font-semibold text-ink transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isJoining}
                  className="px-5 py-2.5 rounded-xl bg-vault-green text-white hover:bg-vault-hover text-xs font-semibold transition shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Decrypting &amp; Hydrating...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Join &amp; Decrypt Vault</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
