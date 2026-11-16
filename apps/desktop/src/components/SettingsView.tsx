import React, { useState } from "react";
import {
  KeyRound,
  ShieldCheck,
  RefreshCw,
  Download,
  Check,
  AlertCircle,
  Loader2,
  Cloud,
  Clock,
  Copy,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { api } from "../api/client";
import { useToast } from "../context/ToastContext";

interface SettingsViewProps {
  isDriveAuthed: boolean;
  accountEmail: string;
  isAuthLoading: boolean;
  onGoogleLogin: () => Promise<void>;
  onGoogleLogout: () => Promise<void>;
  autoLockMinutes: number;
  onAutoLockMinutesChange: (minutes: number) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  isDriveAuthed,
  accountEmail,
  isAuthLoading,
  onGoogleLogin,
  onGoogleLogout,
  autoLockMinutes,
  onAutoLockMinutesChange,
}) => {
  const { toast } = useToast();

  // Password change state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Recovery phrase state
  const [isRegeneratingPhrase, setIsRegeneratingPhrase] = useState(false);
  const [newPhrase, setNewPhrase] = useState<string | null>(null);
  const [phraseLoading, setPhraseLoading] = useState(false);
  const [copiedPhrase, setCopiedPhrase] = useState(false);

  // Retention policy state
  const [retentionDays, setRetentionDays] = useState<number>(() => {
    return parseInt(localStorage.getItem("sw_history_retention_days") || "90", 10);
  });

  // Diagnostic export state
  const [exportLoading, setExportLoading] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await api.changePassword(newPassword);
      if (res.success) {
        toast.success("✓ Master password updated successfully. WMK re-wrapped.");
        setNewPassword("");
        setConfirmPassword("");
        setIsChangingPassword(false);
      } else {
        setPasswordError(res.message || "Failed to update master password.");
      }
    } catch (err: any) {
      setPasswordError(err?.message || "Failed to update master password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleRegeneratePhrase = async () => {
    const ok = window.confirm(
      "Are you sure you want to regenerate your 24-word recovery phrase?\n\nYour old recovery phrase will become permanently invalid. Your master password will remain unchanged."
    );
    if (!ok) return;

    setPhraseLoading(true);
    try {
      const res = await api.regenerateRecoveryPhrase();
      if (res.success && res.data?.new_recovery_phrase) {
        setNewPhrase(res.data.new_recovery_phrase);
        setIsRegeneratingPhrase(true);
        toast.success("✓ New 24-word recovery phrase active! Please write it down.");
      } else {
        toast.error(res.message || "Failed to regenerate recovery phrase.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to regenerate recovery phrase.");
    } finally {
      setPhraseLoading(false);
    }
  };

  const handleCopyPhrase = () => {
    if (!newPhrase) return;
    navigator.clipboard.writeText(newPhrase);
    setCopiedPhrase(true);
    toast.success("✓ Recovery phrase copied to clipboard.");
    setTimeout(() => setCopiedPhrase(false), 2500);
  };

  const handleRetentionChange = (days: number) => {
    setRetentionDays(days);
    localStorage.setItem("sw_history_retention_days", String(days));
    toast.info(`History retention set to ${days === 0 ? "Forever" : `${days} days`}.`);
  };

  const handleExportDiagnostics = async () => {
    setExportLoading(true);
    try {
      const res = await api.exportDiagnosticLogs();
      if (res.success && res.data?.diagnostic_report) {
        const jsonStr = JSON.stringify(res.data.diagnostic_report, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `secureworkspace-diagnostic-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("✓ Diagnostic report exported.");
      } else {
        toast.error(res.message || "Failed to generate diagnostics.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Diagnostic export failed.");
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-ink">Settings &amp; Security</h2>
        <p className="text-sm text-ink-muted mt-1">
          Configure cloud storage authentication, auto-lock timers, security credentials, and maintenance.
        </p>
      </div>

      {/* 1. Google Drive Cloud Storage */}
      <div className="bg-surface-card p-6 rounded-2xl border border-line space-y-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-vault-mint/15 text-vault-green flex items-center justify-center font-bold text-sm">
              <Cloud className="w-5 h-5 text-vault-green" />
            </div>
            <div>
              <div className="font-semibold text-sm text-ink">Google Drive Cloud Storage</div>
              <div className="text-xs text-ink-muted">
                Restricted to <code className="text-xs bg-mineral px-1.5 py-0.5 rounded font-mono">drive.file</code> scope inside dedicated folder
              </div>
            </div>
          </div>

          <div>
            {isDriveAuthed ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#E6F4EA] text-[#137333]">
                <Check className="w-3.5 h-3.5" /> Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-mineral text-ink-muted">
                Not connected
              </span>
            )}
          </div>
        </div>

        <div className="p-4 bg-mineral/30 rounded-xl flex items-center justify-between text-xs border border-line/60">
          <div>
            <span className="text-ink-muted">Authorized Account: </span>
            <span className="font-semibold text-ink">{isDriveAuthed ? accountEmail : "None"}</span>
          </div>

          <div className="flex items-center gap-2">
            {!isDriveAuthed ? (
              <button
                onClick={onGoogleLogin}
                disabled={isAuthLoading}
                className="py-1.5 px-4 rounded-lg text-xs font-semibold bg-vault-green text-white hover:bg-vault-hover transition shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {isAuthLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Authorizing...
                  </>
                ) : (
                  "Authorize Google Drive"
                )}
              </button>
            ) : (
              <>
                <button
                  onClick={onGoogleLogin}
                  disabled={isAuthLoading}
                  className="py-1.5 px-3 rounded-lg text-xs font-medium border border-line text-ink hover:bg-mineral transition cursor-pointer"
                >
                  Switch Account
                </button>
                <button
                  onClick={onGoogleLogout}
                  disabled={isAuthLoading}
                  className="py-1.5 px-3 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition border border-red-200 cursor-pointer"
                >
                  Disconnect
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Security Credentials: Master Password & Recovery Phrase */}
      <div className="bg-surface-card p-6 rounded-2xl border border-line space-y-5 shadow-2xs">
        <div className="flex items-center gap-2.5 pb-3 border-b border-line">
          <KeyRound className="w-5 h-5 text-vault-green" />
          <h3 className="text-base font-bold text-ink">Security Credentials</h3>
        </div>

        {/* Change Master Password Subcard */}
        <div className="p-4 rounded-xl border border-line bg-surface space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-xs text-ink">Master Password</div>
              <div className="text-[11px] text-ink-muted">
                Derives the primary KEK with Argon2id memory-hard hashing to unwrap your WMK.
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsChangingPassword(!isChangingPassword);
                setPasswordError("");
              }}
              className="py-1.5 px-3 rounded-lg text-xs font-medium border border-line text-ink hover:bg-mineral transition cursor-pointer"
            >
              {isChangingPassword ? "Cancel" : "Change Password"}
            </button>
          </div>

          {isChangingPassword && (
            <form onSubmit={handlePasswordSubmit} className="pt-3 border-t border-line/60 space-y-3">
              {passwordError && (
                <div className="p-2.5 bg-danger-subtle border border-danger/20 text-danger text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-ink-muted mb-1">
                    New Master Password (min 8 chars)
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-3 py-2 text-xs border border-line rounded-lg bg-surface-card focus:outline-none focus:border-vault-green"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-ink-muted mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-3 py-2 text-xs border border-line rounded-lg bg-surface-card focus:outline-none focus:border-vault-green"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={passwordLoading || !newPassword || !confirmPassword}
                  className="py-1.5 px-4 rounded-lg text-xs font-semibold bg-vault-green text-white hover:bg-vault-hover transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {passwordLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Re-wrapping WMK...
                    </>
                  ) : (
                    "Save New Password"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* 24-Word Recovery Phrase Subcard */}
        <div className="p-4 rounded-xl border border-line bg-surface space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-xs text-ink">24-Word BIP-39 Recovery Phrase</div>
              <div className="text-[11px] text-ink-muted">
                Emergency cold recovery slot. Can unlock the entire vault if password is lost.
              </div>
            </div>

            <button
              type="button"
              onClick={handleRegeneratePhrase}
              disabled={phraseLoading}
              className="py-1.5 px-3 rounded-lg text-xs font-medium border border-line text-ink hover:bg-mineral transition disabled:opacity-50 flex items-center gap-1 cursor-pointer"
            >
              {phraseLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3" />
                  Regenerate Phrase
                </>
              )}
            </button>
          </div>

          {newPhrase && isRegeneratingPhrase && (
            <div className="pt-3 border-t border-line/60 space-y-3 animate-in fade-in duration-200">
              <div className="p-3 bg-amber-500/10 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-700" />
                  Your New Active 24-Word Recovery Phrase
                </div>
                <p className="text-[11px] text-amber-800">
                  Write these words down on paper and store them in a secure location. This phrase will not be shown again.
                </p>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5 p-3 bg-white rounded-xl border border-line font-mono text-xs">
                {newPhrase.split(" ").map((w, idx) => (
                  <div key={idx} className="p-1 bg-mineral/40 rounded flex items-center gap-1">
                    <span className="text-[10px] text-ink-muted w-4">{idx + 1}.</span>
                    <span className="font-semibold text-ink">{w}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-1">
                <button
                  type="button"
                  onClick={handleCopyPhrase}
                  className="py-1.5 px-3 rounded-lg text-xs font-medium border border-line text-ink hover:bg-mineral transition flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedPhrase ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-vault-green" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy to Clipboard</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsRegeneratingPhrase(false)}
                  className="py-1.5 px-4 rounded-lg text-xs font-semibold bg-vault-green text-white hover:bg-vault-hover transition cursor-pointer"
                >
                  I Have Saved These Words
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Operational Preferences: Auto-Lock & Retention */}
      <div className="bg-surface-card p-6 rounded-2xl border border-line space-y-5 shadow-2xs">
        <div className="flex items-center gap-2.5 pb-3 border-b border-line">
          <Clock className="w-5 h-5 text-vault-green" />
          <h3 className="text-base font-bold text-ink">Inactivity &amp; Retention Preferences</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Auto-Lock Countdown Selector */}
          <div className="p-4 rounded-xl border border-line bg-surface space-y-2">
            <label className="block text-xs font-semibold text-ink">
              Inactivity Auto-Lock Timeout
            </label>
            <p className="text-[11px] text-ink-muted leading-relaxed">
              When inactive, the vault automatically scrubs cryptographic keys from memory.
            </p>
            <select
              value={autoLockMinutes}
              onChange={(e) => onAutoLockMinutesChange(parseInt(e.target.value, 10))}
              className="w-full mt-2 p-2 border border-line rounded-lg text-xs bg-surface-card text-ink font-medium focus:outline-none focus:border-vault-green cursor-pointer"
            >
              <option value={5}>5 minutes</option>
              <option value={15}>15 minutes (Recommended)</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={0}>Never (Not recommended)</option>
            </select>
          </div>

          {/* Version History Retention Selector */}
          <div className="p-4 rounded-xl border border-line bg-surface space-y-2">
            <label className="block text-xs font-semibold text-ink">
              Remote Version History Retention
            </label>
            <p className="text-[11px] text-ink-muted leading-relaxed">
              Duration to preserve past version manifests and delta snapshots.
            </p>
            <select
              value={retentionDays}
              onChange={(e) => handleRetentionChange(parseInt(e.target.value, 10))}
              className="w-full mt-2 p-2 border border-line rounded-lg text-xs bg-surface-card text-ink font-medium focus:outline-none focus:border-vault-green cursor-pointer"
            >
              <option value={30}>30 days</option>
              <option value={90}>90 days (Recommended)</option>
              <option value={365}>1 year</option>
              <option value={0}>Forever</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Maintenance & Diagnostics */}
      <div className="bg-surface-card p-6 rounded-2xl border border-line space-y-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-mineral text-ink flex items-center justify-center font-bold text-sm">
              <FileText className="w-5 h-5 text-vault-green" />
            </div>
            <div>
              <div className="font-semibold text-sm text-ink">Diagnostic &amp; Health Package</div>
              <div className="text-xs text-ink-muted">
                Exports sanitized system and cryptographic state for troubleshooting. Contains zero passwords or keys.
              </div>
            </div>
          </div>

          <button
            onClick={handleExportDiagnostics}
            disabled={exportLoading}
            className="py-2 px-4 rounded-xl text-xs font-semibold border border-line text-ink hover:bg-mineral transition flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            {exportLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-vault-green" />
                Export Diagnostics (.json)
              </>
            )}
          </button>
        </div>
      </div>

      {/* 5. Zero-Knowledge Security Policy */}
      <div className="bg-surface-card p-6 rounded-2xl border border-line space-y-3 shadow-2xs">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <ShieldCheck className="w-4 h-4 text-vault-green" />
          Zero-Knowledge Security Invariants
        </div>
        <div className="text-xs text-ink-muted space-y-1.5 leading-relaxed">
          <p>• <strong>Cipher:</strong> libsodium XChaCha20-Poly1305 SecretStream with forward-secrecy subkeys.</p>
          <p>• <strong>KDF:</strong> Argon2id memory-hard key derivation for master password and 24-word BIP-39 recovery phrase.</p>
          <p>• <strong>Zero Plaintext:</strong> All file payloads, directory names, and relative paths are encrypted before reaching disk or Google Drive.</p>
        </div>
      </div>
    </div>
  );
};