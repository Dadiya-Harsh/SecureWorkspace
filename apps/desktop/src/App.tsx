import { useState, useEffect } from "react";
import { ShieldCheck, Check, Loader2 } from "lucide-react";
import { Sidebar, NavTab } from "./components/Sidebar";
import { HeaderBar } from "./components/HeaderBar";
import { DashboardView } from "./components/DashboardView";
import { FilesView } from "./components/FilesView";
import { DivergedModal } from "./components/DivergedModal";
import { UnlockView } from "./components/UnlockView";
import { CreateWorkspaceWizard } from "./components/CreateWorkspaceWizard";
import { api } from "./api/client";
import { SyncStatusData, WorkspaceFile } from "./api/types";

export function App() {
  const [appState, setAppState] = useState<"unlocked" | "locked" | "wizard">("unlocked");
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");
  const [isDivergedModalOpen, setIsDivergedModalOpen] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(14 * 60 + 52); // 14:52

  const [accountName, setAccountName] = useState("Personal");
  const [accountEmail, setAccountEmail] = useState<string>("name@gmail.com");
  const [isDriveAuthed, setIsDriveAuthed] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);
  const [authMessage, setAuthMessage] = useState<string>("");

  const [status, setStatus] = useState<SyncStatusData>({
    base_version: 14,
    remote_head: 14,
    versions_ahead: 0,
    has_local_changes: true,
    is_diverged: false,
    is_up_to_date: false,
    changes: {
      new: [
        {
          relative_path: "passport-scan.pdf",
          size_bytes: 1450000,
          mtime_epoch: Date.now() / 1000,
        },
      ],
      modified: [
        {
          relative_path: "budget.xlsx",
          size_bytes: 84000,
          mtime_epoch: Date.now() / 1000,
        },
      ],
      deleted: [
        {
          relative_path: "old-notes.csv",
          size_bytes: 12000,
          mtime_epoch: Date.now() / 1000,
        },
      ],
      synced_count: 142,
    },
  });

  const [files, setFiles] = useState<WorkspaceFile[]>([
    {
      name: "budget.xlsx",
      path: "Documents/Taxes/budget.xlsx",
      size_bytes: 84000,
      modified_at: "Today",
      status: "not_pushed",
    },
    {
      name: "return-2025.pdf",
      path: "Documents/Taxes/return-2025.pdf",
      size_bytes: 1200000,
      modified_at: "Mar 3",
      status: "synced",
    },
    {
      name: "receipts.csv",
      path: "Documents/Taxes/receipts.csv",
      size_bytes: 12000,
      modified_at: "Feb 11",
      status: "cloud_only",
    },
    {
      name: "scan-01.jpg",
      path: "Documents/Taxes/scan-01.jpg",
      size_bytes: 3400000,
      modified_at: "Feb 2",
      status: "changed_in_both",
    },
  ]);

  // Auto-lock countdown ticker
  useEffect(() => {
    if (appState !== "unlocked") return;

    const timer = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          setAppState("locked");
          return 15 * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [appState]);

  // Check Google OAuth status on mount
  useEffect(() => {
    api.googleAuthStatus().then((res) => {
      if (res.success && res.data?.authenticated) {
        setIsDriveAuthed(true);
        if (res.data.email) {
          setAccountEmail(res.data.email);
        }
      }
    });
  }, []);

  const handleGoogleLogin = async () => {
    setIsAuthLoading(true);
    setAuthMessage("");
    try {
      const res = await api.googleAuthLogin();
      if (res.success && res.data?.authenticated) {
        setIsDriveAuthed(true);
        if (res.data.email) {
          setAccountEmail(res.data.email);
        }
        setAuthMessage("✓ Google Drive connected successfully!");
      } else {
        setAuthMessage(res.message || "Failed to authorize Google Drive.");
      }
    } catch (e: any) {
      setAuthMessage(e?.message || "Failed to start Google sign-in.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleGoogleLogout = async () => {
    setIsAuthLoading(true);
    setAuthMessage("");
    try {
      const res = await api.googleAuthLogout();
      if (res.success) {
        setIsDriveAuthed(false);
        setAccountEmail("Not connected");
        setAuthMessage("Google Drive disconnected.");
      }
    } catch (e: any) {
      setAuthMessage(e?.message || "Failed to disconnect.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const formatCountdown = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Actions
  const handleLock = async () => {
    await api.lock();
    setAppState("locked");
  };

  const handleUnlock = async (token: string): Promise<boolean> => {
    // For dev preview: allow any password >= 6 chars or valid recovery key
    if (token.length >= 6) {
      setAppState("unlocked");
      setCountdownSeconds(15 * 60);
      return true;
    }
    return false;
  };

  const handlePush = async () => {
    const res = await api.push("Pushed changes from Desktop");
    if (res.success) {
      setStatus((prev) => ({
        ...prev,
        base_version: prev.base_version + 1,
        remote_head: prev.base_version + 1,
        has_local_changes: false,
        is_up_to_date: true,
        changes: { new: [], modified: [], deleted: [], synced_count: prev.changes.synced_count + 3 },
      }));
      setFiles((prev) =>
        prev.map((f) => (f.status === "not_pushed" ? { ...f, status: "synced" } : f))
      );
    }
  };

  const handleDivergedResolution = (_action: string) => {
    setIsDivergedModalOpen(false);
    setStatus((prev) => ({
      ...prev,
      is_diverged: false,
      base_version: prev.base_version + 1,
      remote_head: prev.base_version + 1,
      has_local_changes: false,
      is_up_to_date: true,
      changes: { new: [], modified: [], deleted: [], synced_count: prev.changes.synced_count + 2 },
    }));
  };

  // Render State
  if (appState === "wizard") {
    return (
      <CreateWorkspaceWizard
        onCancel={() => setAppState("locked")}
        onComplete={(_path, name) => {
          setAccountName(name);
          setAppState("unlocked");
          setCountdownSeconds(15 * 60);
        }}
      />
    );
  }

  if (appState === "locked") {
    return (
      <UnlockView
        workspaceName={accountName}
        accountEmail={accountEmail}
        version={status.base_version}
        onUnlock={handleUnlock}
        onCreateNewWorkspace={() => setAppState("wizard")}
      />
    );
  }

  const pendingCount =
    status.changes.new.length +
    status.changes.modified.length +
    status.changes.deleted.length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-mineral text-ink font-sans">
      {/* Dark Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLock={handleLock}
        lockCountdown={formatCountdown(countdownSeconds)}
      />

      {/* Main App Canvas */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header Bar */}
        <HeaderBar
          accountName={accountName}
          accountEmail={accountEmail}
          pushCount={pendingCount}
          isUpToDate={status.is_up_to_date}
          isDiverged={status.is_diverged}
          onPushClick={handlePush}
          onDivergedClick={() => setIsDivergedModalOpen(true)}
        />

        {/* Tab Content Body */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === "dashboard" && (
            <DashboardView
              status={status}
              onPush={handlePush}
              onBackup={() => alert("Connecting to local drive for encrypted snapshot...")}
            />
          )}

          {activeTab === "files" && (
            <FilesView
              files={files}
              onAddFiles={() => alert("Select file dialog will open")}
              onOpenFile={(f) => alert(`Opening ${f.name} in default application...`)}
              onExportFile={(f) => alert(`Exporting decrypted copy of ${f.name}...`)}
              onViewHistory={(f) => alert(`Loading version history for ${f.name}...`)}
            />
          )}

          {activeTab === "sync" && (
            <div className="p-8 max-w-4xl mx-auto space-y-4">
              <h2 className="text-xl font-bold">Sync Management</h2>
              <p className="text-sm text-ink-muted">
                Control remote operations and divergence policies.
              </p>
              <div className="bg-surface-card p-6 rounded-xl border border-line space-y-4">
                <button
                  onClick={() => setIsDivergedModalOpen(true)}
                  className="px-4 py-2 bg-mineral hover:bg-mineral/80 rounded-lg text-sm font-medium border border-line"
                >
                  Preview Diverged Conflict Dialog
                </button>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="p-8 max-w-4xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-bold text-ink">Settings & Security</h2>
                <p className="text-sm text-ink-muted mt-1">
                  Configure cloud storage authentication, auto-lock timers, and security policies.
                </p>
              </div>

              {/* Google Drive Card */}
              <div className="bg-surface-card p-6 rounded-xl border border-line space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-vault-green/10 text-vault-green flex items-center justify-center font-bold text-sm">
                      GD
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-ink">Google Drive Cloud Storage</div>
                      <div className="text-xs text-ink-muted">
                        Restricted to <code className="text-xs bg-mineral px-1 py-0.5 rounded">drive.file</code> scope inside dedicated folder
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

                <div className="p-4 bg-mineral/30 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <span className="text-ink-muted">Authorized Account: </span>
                    <span className="font-medium text-ink">{isDriveAuthed ? accountEmail : "None"}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isDriveAuthed ? (
                      <button
                        onClick={handleGoogleLogin}
                        disabled={isAuthLoading}
                        className="py-1.5 px-4 rounded-lg text-xs font-semibold bg-vault-green text-white hover:bg-vault-hover transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {isAuthLoading ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Authorizing...
                          </>
                        ) : (
                          "Authorize Google Drive"
                        )}
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleGoogleLogin}
                          disabled={isAuthLoading}
                          className="py-1.5 px-3 rounded-lg text-xs font-medium border border-line text-ink hover:bg-mineral transition"
                        >
                          Switch Account
                        </button>
                        <button
                          onClick={handleGoogleLogout}
                          disabled={isAuthLoading}
                          className="py-1.5 px-3 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition border border-red-200"
                        >
                          Disconnect
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {authMessage && (
                  <div className="text-xs font-medium text-vault-green">
                    {authMessage}
                  </div>
                )}
              </div>

              {/* Zero-Knowledge Security Policy */}
              <div className="bg-surface-card p-6 rounded-xl border border-line space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <ShieldCheck className="w-4 h-4 text-vault-green" />
                  Zero-Knowledge Security Invariants
                </div>
                <div className="text-xs text-ink-muted space-y-1.5 leading-relaxed">
                  <p>• <strong>Cipher:</strong> libsodium XChaCha20-Poly1305 SecretStream with forward secrecy subkeys.</p>
                  <p>• <strong>KDF:</strong> Argon2id memory-hard key derivation for master password and 24-word BIP-39 recovery phrase.</p>
                  <p>• <strong>Zero Plaintext:</strong> All file payloads, directory names, and relative paths are encrypted before reaching disk or Google Drive.</p>
                </div>
              </div>
            </div>
          )}

          {["history", "backups"].includes(activeTab) && (
            <div className="p-8 max-w-4xl mx-auto space-y-4">
              <h2 className="text-xl font-bold capitalize">{activeTab}</h2>
              <p className="text-sm text-ink-muted">
                {activeTab === "history" && "Browse past versions and revert workspace."}
                {activeTab === "backups" && "Manage local external HDD offline snapshots."}
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Diverged Conflict Modal */}
      <DivergedModal
        isOpen={isDivergedModalOpen}
        onClose={() => setIsDivergedModalOpen(false)}
        onPullKeepDrive={() => handleDivergedResolution("keep_drive")}
        onKeepBoth={() => handleDivergedResolution("keep_both")}
        onForcePush={() => handleDivergedResolution("force_push")}
      />
    </div>
  );
}

export default App;
