import React, { useState, useEffect } from "react";
import {
  Check,
  Eye,
  EyeOff,
  Copy,
  Download,
  Printer,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { api } from "../api/client";

interface CreateWorkspaceWizardProps {
  onCancel: () => void;
  onComplete: (workspacePath: string, name: string, recoveryPhrase: string) => void;
}

export const CreateWorkspaceWizard: React.FC<CreateWorkspaceWizardProps> = ({
  onCancel,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [name, setName] = useState("Personal");
  const [workspacePath, setWorkspacePath] = useState("D:/SecureWorkspaces/Personal");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Simulated generated 24-word recovery phrase for wizard preview
  const [recoveryWords] = useState<string[]>([
    "abandon", "ability", "able", "about", "above", "absent",
    "absorb", "abstract", "absurd", "abuse", "access", "accident",
    "account", "accuse", "achieve", "acid", "acoustic", "acquire",
    "across", "act", "action", "actor", "actress", "actual",
  ]);

  const [isWordsRevealed, setIsWordsRevealed] = useState(false);
  const [isSavedConfirmed, setIsSavedConfirmed] = useState(false);
  const [testInput, setTestInput] = useState("");
  const [testError, setTestError] = useState("");
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [connectedEmail, setConnectedEmail] = useState<string>("name@gmail.com");
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (currentStep === 5) {
      api.googleAuthStatus().then((res) => {
        if (res.success && res.data?.authenticated) {
          setIsDriveConnected(true);
          if (res.data.email) {
            setConnectedEmail(res.data.email);
          }
        }
      });
    }
  }, [currentStep]);

  const handleAuthorizeDrive = async () => {
    setIsAuthorizing(true);
    setAuthError("");
    try {
      const res = await api.googleAuthLogin();
      if (res.success && res.data?.authenticated) {
        setIsDriveConnected(true);
        if (res.data.email) {
          setConnectedEmail(res.data.email);
        }
      } else {
        setAuthError(res.message || "Authorization failed.");
      }
    } catch (err: any) {
      setAuthError(err?.message || "Failed to initiate Google authorization.");
    } finally {
      setIsAuthorizing(false);
    }
  };

  const steps = [
    { num: 1, label: "Name" },
    { num: 2, label: "Password" },
    { num: 3, label: "Recovery key" },
    { num: 4, label: "Recovery test" },
    { num: 5, label: "Connect Drive" },
  ];

  const handleCopyPhrase = () => {
    navigator.clipboard.writeText(recoveryWords.join(" "));
  };

  const handleDownloadFile = () => {
    const blob = new Blob([recoveryWords.join(" ")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `secureworkspace-recovery-${name.toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleVerifyTest = () => {
    const words = testInput.trim().split(/\s+/);
    if (words.length !== 24) {
      setTestError(`Expected 24 words, but got ${words.length}.`);
      return;
    }
    if (words.join(" ") !== recoveryWords.join(" ")) {
      setTestError("Words do not match the generated recovery key.");
      return;
    }
    setTestError("");
    setCurrentStep(5);
  };

  return (
    <div className="min-h-screen w-full flex bg-surface select-none">
      {/* 5-Step Left Progress Rail */}
      <div className="w-64 bg-rail text-ink-light p-8 flex flex-col justify-between border-r border-line-dark/40">
        <div>
          <div className="text-white font-semibold text-lg flex items-center gap-2 mb-10">
            <span className="w-2.5 h-2.5 rounded-full bg-vault-mint inline-block" />
            New Workspace
          </div>

          <div className="space-y-6">
            {steps.map((s) => {
              const isPast = currentStep > s.num;
              const isCurrent = currentStep === s.num;
              return (
                <div key={s.num} className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition ${
                      isPast
                        ? "bg-vault-mint text-rail"
                        : isCurrent
                        ? "border-2 border-vault-mint text-vault-mint bg-rail-active"
                        : "border border-line-dark text-ink-light/40"
                    }`}
                  >
                    {isPast ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s.num}
                  </div>
                  <span
                    className={`text-sm ${
                      isCurrent
                        ? "text-white font-semibold"
                        : isPast
                        ? "text-ink-light/80"
                        : "text-ink-light/40"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={onCancel}
          className="text-xs text-ink-light/50 hover:text-white transition flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Cancel setup
        </button>
      </div>

      {/* Main Wizard Content Area */}
      <div className="flex-1 flex flex-col justify-center items-center p-12">
        <div className="w-full max-w-2xl bg-surface-card p-10 rounded-2xl border border-line shadow-sm space-y-8">
          {/* Step 1: Workspace Name and Path */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-ink">Name your workspace</h2>
                <p className="text-sm text-ink-muted mt-1">
                  Choose a nickname and local directory for this zero-knowledge vault.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">
                    Workspace Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full py-2.5 px-3.5 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:border-vault-green"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">
                    Folder Location
                  </label>
                  <input
                    type="text"
                    value={workspacePath}
                    onChange={(e) => setWorkspacePath(e.target.value)}
                    className="w-full py-2.5 px-3.5 rounded-xl border border-line bg-surface text-ink text-sm font-mono focus:outline-none focus:border-vault-green"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={!name.trim() || !workspacePath.trim()}
                  className="py-2.5 px-6 rounded-xl text-sm font-medium bg-vault-green text-white hover:bg-vault-hover transition shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Master Password */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-ink">Set a master password</h2>
                <p className="text-sm text-ink-muted mt-1">
                  Derives the local key with Argon2id. Must be at least 8 characters.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">
                    Master Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full py-2.5 px-3.5 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:border-vault-green"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full py-2.5 px-3.5 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:border-vault-green"
                  />
                </div>

                {password && confirmPassword && password !== confirmPassword && (
                  <div className="text-xs text-danger font-medium">
                    Passwords do not match.
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="py-2.5 px-5 rounded-xl text-sm font-medium border border-line text-ink hover:bg-mineral/40"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  disabled={password.length < 8 || password !== confirmPassword}
                  className="py-2.5 px-6 rounded-xl text-sm font-medium bg-vault-green text-white hover:bg-vault-hover transition shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: 24-Word Recovery Key (as in Create workspace.png) */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-ink">Save your recovery key</h2>
                <p className="text-sm text-ink-muted mt-1 leading-relaxed">
                  These 24 words unwrap your encryption keys if you ever forget your password. We cannot restore your files if you lose both.
                </p>
              </div>

              {/* 4x6 Word Grid with Blur & Reveal */}
              <div className="relative border border-line rounded-xl p-5 bg-mineral/20">
                <div
                  className={`grid grid-cols-4 gap-3 text-sm font-mono ${
                    !isWordsRevealed ? "filter blur-sm select-none" : ""
                  }`}
                >
                  {recoveryWords.map((word, idx) => (
                    <div
                      key={idx}
                      className="bg-surface-card border border-line px-3 py-2 rounded-lg flex items-center gap-2 text-ink"
                    >
                      <span className="text-ink-muted/50 text-xs w-4">
                        {idx + 1}.
                      </span>
                      <span className="font-semibold">{word}</span>
                    </div>
                  ))}
                </div>

                {!isWordsRevealed && (
                  <div className="absolute inset-0 flex items-center justify-center bg-surface-card/40 backdrop-blur-xs rounded-xl">
                    <button
                      onClick={() => setIsWordsRevealed(true)}
                      className="py-2 px-4 rounded-xl text-xs font-semibold bg-ink text-white hover:bg-ink-muted transition flex items-center gap-2 shadow-md"
                    >
                      <Eye className="w-4 h-4" /> Reveal recovery phrase
                    </button>
                  </div>
                )}
              </div>

              {/* Word Actions Bar */}
              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadFile}
                    className="px-3 py-1.5 rounded-lg border border-line hover:bg-mineral/40 text-ink font-medium flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Save as file
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded-lg border border-line hover:bg-mineral/40 text-ink font-medium flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print
                  </button>
                  <button
                    onClick={handleCopyPhrase}
                    className="px-3 py-1.5 rounded-lg border border-line hover:bg-mineral/40 text-ink font-medium flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </button>
                </div>

                {isWordsRevealed && (
                  <button
                    onClick={() => setIsWordsRevealed(false)}
                    className="text-ink-muted hover:text-ink text-xs flex items-center gap-1"
                  >
                    <EyeOff className="w-3.5 h-3.5" /> Hide
                  </button>
                )}
              </div>

              {/* Mandatory Confirmation Checkbox */}
              <label className="flex items-start gap-3 p-4 bg-mineral/30 border border-line rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSavedConfirmed}
                  onChange={(e) => setIsSavedConfirmed(e.target.checked)}
                  className="mt-0.5 rounded text-vault-green focus:ring-vault-green"
                />
                <span className="text-xs text-ink leading-relaxed font-medium">
                  I wrote this down or saved it. Without it or the password, files are permanently lost.
                </span>
              </label>

              <div className="pt-2 flex justify-between">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="py-2.5 px-5 rounded-xl text-sm font-medium border border-line text-ink hover:bg-mineral/40"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(4)}
                  disabled={!isSavedConfirmed}
                  className="py-2.5 px-6 rounded-xl text-sm font-medium bg-vault-green text-white hover:bg-vault-hover transition shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  Verify recovery test <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Recovery Test Verification */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-ink">Test your recovery key</h2>
                <p className="text-sm text-ink-muted mt-1 leading-relaxed">
                  To ensure you can recover your files in an emergency, paste or type all 24 words below.
                </p>
              </div>

              <div>
                <textarea
                  rows={4}
                  placeholder="Paste or type all 24 words separated by spaces..."
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  className="w-full py-2.5 px-3.5 rounded-xl border border-line bg-surface text-ink text-sm font-mono focus:outline-none focus:border-vault-green"
                />
                {testError && (
                  <div className="mt-2 text-xs text-danger font-medium">
                    {testError}
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-between">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="py-2.5 px-5 rounded-xl text-sm font-medium border border-line text-ink hover:bg-mineral/40"
                >
                  Back
                </button>
                <button
                  onClick={handleVerifyTest}
                  disabled={!testInput.trim()}
                  className="py-2.5 px-6 rounded-xl text-sm font-medium bg-vault-green text-white hover:bg-vault-hover transition shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  Confirm & connect Drive <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Connect Google Drive */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-ink">Connect Google Drive</h2>
                <p className="text-sm text-ink-muted mt-1 leading-relaxed">
                  SecureWorkspace asks only for the <code className="text-xs bg-mineral px-1.5 py-0.5 rounded">drive.file</code> scope. It can only see encrypted files inside its own folder.
                </p>
              </div>

              <div className="p-6 border border-line rounded-xl bg-surface flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-vault-green/10 text-vault-green flex items-center justify-center font-bold text-lg">
                  GD
                </div>

                <div>
                  <div className="font-semibold text-sm text-ink">Google Account</div>
                  <div className="text-xs text-ink-muted mt-0.5">
                    {isDriveConnected ? `Connected as ${connectedEmail}` : "Not connected yet"}
                  </div>
                </div>

                {authError && (
                  <div className="w-full max-w-sm flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FCE8E6] text-[#C5221F] text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                {!isDriveConnected ? (
                  <button
                    onClick={handleAuthorizeDrive}
                    disabled={isAuthorizing}
                    className="py-2 px-5 rounded-xl text-xs font-semibold bg-vault-green text-white hover:bg-vault-hover transition shadow-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {isAuthorizing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Authorizing in browser...
                      </>
                    ) : (
                      "Authorize Google Drive"
                    )}
                  </button>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#E6F4EA] text-[#137333]">
                      <Check className="w-3.5 h-3.5" /> Connected as {connectedEmail}
                    </div>
                    <button
                      onClick={handleAuthorizeDrive}
                      disabled={isAuthorizing}
                      className="text-[11px] text-ink-muted hover:text-ink underline transition"
                    >
                      Switch Google Account
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-between">
                <button
                  onClick={() => setCurrentStep(4)}
                  className="py-2.5 px-5 rounded-xl text-sm font-medium border border-line text-ink hover:bg-mineral/40"
                >
                  Back
                </button>
                <button
                  onClick={() => onComplete(workspacePath, name, recoveryWords.join(" "))}
                  disabled={!isDriveConnected}
                  className="py-2.5 px-6 rounded-xl text-sm font-medium bg-vault-green text-white hover:bg-vault-hover transition shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  Open Workspace <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
