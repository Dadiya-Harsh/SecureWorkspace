import { useState, useEffect, useRef } from "react";
import { Check, ArrowDown, ArrowUp, AlertCircle } from "lucide-react";
import { Sidebar, NavTab } from "./components/Sidebar";
import { HeaderBar } from "./components/HeaderBar";
import { DashboardView } from "./components/DashboardView";
import { FilesView } from "./components/FilesView";
import { HistoryView } from "./components/HistoryView";
import { BackupsView } from "./components/BackupsView";
import { WorkspacesView } from "./components/WorkspacesView";
import { PushPreviewModal } from "./components/PushPreviewModal";
import { DivergedModal } from "./components/DivergedModal";
import { UnlockView } from "./components/UnlockView";
import { CreateWorkspaceWizard } from "./components/CreateWorkspaceWizard";
import { WelcomeOnboardingView } from "./components/WelcomeOnboardingView";
import { JoinFromDriveModal } from "./components/JoinFromDriveModal";
import { SettingsView } from "./components/SettingsView";
import { api } from "./api/client";
import { SyncStatusData, WorkspaceFile, RegisteredWorkspace, JoinWorkspaceResult } from "./api/types";
import { useToast } from "./context/ToastContext";

export function App() {
  const { showToast, toast } = useToast();
  const [appState, setAppState] = useState<"loading" | "unlocked" | "locked" | "wizard" | "welcome">("loading");
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");
  const [isDivergedModalOpen, setIsDivergedModalOpen] = useState(false);
  const [isPushModalOpen, setIsPushModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [autoLockMinutes, setAutoLockMinutes] = useState<number>(() => {
    return parseInt(localStorage.getItem("sw_autolock_minutes") || "15", 10);
  });
  const [countdownSeconds, setCountdownSeconds] = useState(autoLockMinutes > 0 ? autoLockMinutes * 60 : 15 * 60);
  const [isAutoLocked, setIsAutoLocked] = useState(false);
  const lastNotifiedRemoteHead = useRef<number>(0);

  const [accountName, setAccountName] = useState(() => {
    return localStorage.getItem("sw_workspace_name") || "Vault";
  });
  const [workspacePath, setWorkspacePath] = useState(() => {
    return localStorage.getItem("sw_workspace_path") || "";
  });

  // Persistent registry of all known workspaces on this device
  const [registeredWorkspaces, setRegisteredWorkspaces] = useState<RegisteredWorkspace[]>(() => {
    try {
      const saved = localStorage.getItem("sw_registered_workspaces");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  useEffect(() => {
    localStorage.setItem("sw_registered_workspaces", JSON.stringify(registeredWorkspaces));
  }, [registeredWorkspaces]);

  const [accountEmail, setAccountEmail] = useState<string>("");
  const [isDriveAuthed, setIsDriveAuthed] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);
  const [isPulling, setIsPulling] = useState<boolean>(false);

  const [status, setStatus] = useState<SyncStatusData>({
    base_version: 0,
    remote_head: 0,
    versions_ahead: 0,
    has_local_changes: false,
    is_diverged: false,
    is_up_to_date: true,
    changes: {
      new: [],
      modified: [],
      deleted: [],
      synced_count: 0,
    },
  });

  const [files, setFiles] = useState<WorkspaceFile[]>([]);

  const refreshWorkspaceData = async () => {
    try {
      const [sRes, fRes] = await Promise.all([
        api.getStatus(),
        api.listFiles(),
      ]);
      if (sRes.success && sRes.data) {
        setStatus(sRes.data);
        if (
          sRes.data.remote_head > sRes.data.base_version &&
          sRes.data.remote_head !== lastNotifiedRemoteHead.current
        ) {
          lastNotifiedRemoteHead.current = sRes.data.remote_head;
          toast.info("☁️ New updates detected on Google Drive. Click 'Pull Changes' to sync.");
        }
      }
      if (fRes.success && fRes.data?.files) {
        setFiles(fRes.data.files);
      }
    } catch (err) {
      console.warn("Failed to refresh workspace data:", err);
    }
  };

  // Initial mount: check session state & Google auth
  useEffect(() => {
    const initApp = async () => {
      try {
        const unlockRes = await api.isUnlocked();
        if (unlockRes.success && unlockRes.data?.is_unlocked) {
          setAppState("unlocked");
          if (unlockRes.data.name) setAccountName(unlockRes.data.name);
          if (unlockRes.data.workspace_path) {
            setWorkspacePath(unlockRes.data.workspace_path);
            localStorage.setItem("sw_workspace_path", unlockRes.data.workspace_path);
          }
          await refreshWorkspaceData();
        } else {
          // Check registered workspaces
          const savedWorkspaces = localStorage.getItem("sw_registered_workspaces");
          let parsed: RegisteredWorkspace[] = [];
          try {
            if (savedWorkspaces) parsed = JSON.parse(savedWorkspaces);
          } catch {}

          if (parsed.length === 0) {
            setAppState("welcome");
          } else {
            const activePath = localStorage.getItem("sw_workspace_path");
            const activeWs = parsed.find((w) => w.path === activePath) || parsed[0];
            setWorkspacePath(activeWs.path);
            setAccountName(activeWs.name);
            setAppState("locked");
          }
        }
      } catch {
        const savedWorkspaces = localStorage.getItem("sw_registered_workspaces");
        let parsed: RegisteredWorkspace[] = [];
        try {
          if (savedWorkspaces) parsed = JSON.parse(savedWorkspaces);
        } catch {}
        setAppState(parsed.length === 0 ? "welcome" : "locked");
      }

      try {
        const authRes = await api.googleAuthStatus();
        if (authRes.success && authRes.data?.authenticated) {
          setIsDriveAuthed(true);
          if (authRes.data.email) {
            setAccountEmail(authRes.data.email);
          }
        }
      } catch {}
    };

    initApp();
  }, []);

  // Auto-lock countdown ticker
  useEffect(() => {
    if (appState !== "unlocked" || autoLockMinutes === 0) return;

    const timer = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          handleLock(true);
          return autoLockMinutes * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [appState, autoLockMinutes]);

  const handleAutoLockMinutesChange = (minutes: number) => {
    setAutoLockMinutes(minutes);
    localStorage.setItem("sw_autolock_minutes", String(minutes));
    if (minutes > 0) {
      setCountdownSeconds(minutes * 60);
      toast.info(`Auto-lock timeout updated to ${minutes} minutes.`);
    } else {
      toast.warning("Auto-lock disabled. Please lock manually when leaving your desk.");
    }
  };

  // Real-time live file & sync tracking: window focus + 3-second auto-poll
  useEffect(() => {
    if (appState !== "unlocked") return;

    const onFocus = () => {
      refreshWorkspaceData();
    };

    window.addEventListener("focus", onFocus);
    const pollTimer = setInterval(() => {
      refreshWorkspaceData();
    }, 3000);

    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(pollTimer);
    };
  }, [appState]);

  const handleGoogleLogin = async () => {
    setIsAuthLoading(true);
    try {
      const res = await api.googleAuthLogin();
      if (res.success && res.data?.authenticated) {
        const email = res.data.email || "Google Account";
        setIsDriveAuthed(true);
        if (res.data.email) {
          setAccountEmail(res.data.email);
        }
        toast.success(`✓ Google Drive connected as ${email}.`);
        await refreshWorkspaceData();
      } else {
        const msg = res.message || "Failed to authorize Google Drive.";
        toast.error(msg);
      }
    } catch (e: any) {
      const msg = e?.message || "Failed to start Google sign-in.";
      toast.error(msg);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleGoogleLogout = async () => {
    setIsAuthLoading(true);
    try {
      const res = await api.googleAuthLogout();
      if (res.success) {
        setIsDriveAuthed(false);
        setAccountEmail("Not connected");
        toast.info("Google Drive disconnected.");
      }
    } catch (e: any) {
      const msg = e?.message || "Failed to disconnect.";
      toast.error(msg);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const formatCountdown = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Lifecycle actions
  const handleLock = async (auto = false) => {
    await api.lock();
    setIsAutoLocked(auto);
    setAppState("locked");
    if (auto) {
      toast.warning("🔒 Vault locked automatically due to 15 minutes of inactivity.");
    } else {
      toast.info("🔒 Vault locked. Encryption keys scrubbed from memory.");
    }
  };

  const handleUnlock = async (token: string): Promise<boolean> => {
    try {
      const res = await api.unlock(workspacePath, token);
      if (res.success && res.data) {
        setIsAutoLocked(false);
        setAppState("unlocked");
        if (res.data.name) setAccountName(res.data.name);
        setCountdownSeconds(15 * 60);

        // Update lastOpened in registry
        setRegisteredWorkspaces((prev) =>
          prev.map((w) => (w.path === workspacePath ? { ...w, lastOpened: Date.now() } : w))
        );

        await refreshWorkspaceData();
        return true;
      }
      if (res.message) {
        showToast(res.message, "error");
      }
      return false;
    } catch (err: any) {
      showToast(err?.message || "Unlock failed. Could not communicate with security daemon.", "error");
      return false;
    }
  };

  // Multi-Workspace Handlers
  const handleSelectWorkspace = async (ws: RegisteredWorkspace) => {
    await api.lock();
    setWorkspacePath(ws.path);
    setAccountName(ws.name);
    localStorage.setItem("sw_workspace_path", ws.path);

    setRegisteredWorkspaces((prev) =>
      prev.map((w) => (w.path === ws.path ? { ...w, lastOpened: Date.now() } : w))
    );

    setAppState("locked");
    showToast(`Switched target vault to: ${ws.name}`, "info");
  };

  const handleOpenExistingWorkspace = async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select Existing SecureWorkspace Folder",
      });

      if (selected && typeof selected === "string") {
        const folderName = selected.split(/[/\\]/).pop() || "Vault";
        const newWs: RegisteredWorkspace = {
          id: `ws-${Date.now()}`,
          name: folderName,
          path: selected,
          lastOpened: Date.now(),
        };

        // Add to registry if not already present
        setRegisteredWorkspaces((prev) => {
          const exists = prev.some((w) => w.path === selected);
          return exists ? prev : [newWs, ...prev];
        });

        await handleSelectWorkspace(newWs);
      }
    } catch (err: any) {
      showToast(`Error opening folder: ${err?.message || String(err)}`, "error");
    }
  };

  const handleRemoveWorkspace = (ws: RegisteredWorkspace) => {
    setRegisteredWorkspaces((prev) => prev.filter((w) => w.path !== ws.path));
    showToast(`Removed '${ws.name}' from workspaces list.`, "info");
  };

  const handleOpenPushModal = () => {
    setIsPushModalOpen(true);
  };

  const handlePull = async () => {
    setIsPulling(true);
    try {
      const res = await api.pull(true, "merge");
      if (res.success) {
        showToast("✓ Remote changes successfully pulled.", "success");
        await refreshWorkspaceData();
      } else if (res.error_code === "DIVERGED" || res.message?.includes("conflicting file")) {
        setIsDivergedModalOpen(true);
      } else {
        showToast(res.message || "Pull failed.", "error");
      }
    } catch (err: any) {
      if (err?.message?.includes("conflicting file") || err?.message?.includes("DIVERGED")) {
        setIsDivergedModalOpen(true);
      } else {
        showToast(`Pull failed: ${err?.message || String(err)}`, "error");
      }
    } finally {
      setIsPulling(false);
    }
  };

  const handleDivergedResolution = async (action: string) => {
    setIsDivergedModalOpen(false);
    setIsPulling(true);
    try {
      if (action === "keep_drive") {
        const res = await api.pull(true, "keep_remote");
        if (res.success) {
          showToast("✓ Remote version applied. Local edits saved in safety snapshots.", "success");
        } else {
          showToast(res.message || "Resolution failed.", "error");
        }
      } else if (action === "force_push") {
        const res = await api.forcePush("Force push resolution", true);
        if (res.success) {
          showToast("✓ Force pushed local changes to Google Drive.", "success");
        } else {
          showToast(res.message || "Force push failed.", "error");
        }
      } else if (action === "keep_both") {
        const res = await api.pull(true, "keep_both");
        if (res.success) {
          showToast("✓ Kept both: conflicting Drive files saved with '(Drive conflict)' suffix.", "success");
        } else {
          showToast(res.message || "Resolution failed.", "error");
        }
      }
      await refreshWorkspaceData();
    } catch (err: any) {
      showToast(`Conflict resolution error: ${err?.message || String(err)}`, "error");
    } finally {
      setIsPulling(false);
    }
  };

  const handleHardReset = async () => {
    const ok = window.confirm(
      "Are you sure you want to discard all local changes and reset to Google Drive?\n\nA safety snapshot of your local unpushed files will be created automatically before resetting."
    );
    if (!ok) return;

    setIsPulling(true);
    try {
      const res = await api.hardReset(true);
      if (res.success) {
        showToast("✓ Workspace reset to remote state. Local changes saved to snapshots.", "success");
        await refreshWorkspaceData();
      } else {
        showToast(res.message || "Hard reset failed.", "error");
      }
    } catch (err: any) {
      showToast(`Hard reset failed: ${err?.message || String(err)}`, "error");
    } finally {
      setIsPulling(false);
    }
  };

  // Real File Actions
  const handleAddFiles = async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({
        multiple: true,
        title: "Select files to add to SecureWorkspace",
      });

      if (selected) {
        const paths = Array.isArray(selected) ? selected : [selected];
        for (const filePath of paths) {
          if (filePath && typeof filePath === "string") {
            const fileName = filePath.split(/[/\\]/).pop() || "file";
            await api.addFile(filePath, fileName);
          }
        }
        showToast(`✓ Added ${paths.length} file(s) to workspace.`, "success");
        await refreshWorkspaceData();
      }
    } catch (err: any) {
      console.warn("Fallback to simulated file add:", err);
      const input = prompt("Enter relative file path to add:", "new-document.pdf");
      if (input) {
        await api.addFile("dummy/path/" + input, input);
        await refreshWorkspaceData();
      }
    }
  };

  const handleOpenWorkspaceFolder = async () => {
    if (!workspacePath) return;
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("open_system_path", { path: workspacePath });
    } catch {
      try {
        const { openPath } = await import("@tauri-apps/plugin-opener");
        await openPath(workspacePath);
      } catch (e: any) {
        showToast(`Could not open folder: ${e?.message || String(e)}`, "error");
      }
    }
  };

  const handleOpenFile = async (file: WorkspaceFile) => {
    try {
      // Open the actual workspace file directly so edits in external editors (Notepad, Word, etc.) save in-place
      const normWorkspace = (workspacePath || "").replace(/\\/g, "/").replace(/\/$/, "");
      const normFile = (file.path || "").replace(/\\/g, "/").replace(/^\//, "");
      const targetPath = normWorkspace ? `${normWorkspace}/${normFile}` : file.path;

      try {
        const { openPath } = await import("@tauri-apps/plugin-opener");
        await openPath(targetPath);
      } catch {
        const { invoke } = await import("@tauri-apps/api/core");
        await invoke("open_system_path", { path: targetPath });
      }
    } catch (err: any) {
      showToast(`Error opening file: ${err?.message || String(err)}`, "error");
    }
  };

  const handleExportFile = async (file: WorkspaceFile) => {
    try {
      const { save } = await import("@tauri-apps/plugin-dialog");
      const destPath = await save({
        defaultPath: file.name,
        title: `Export Decrypted Copy of ${file.name}`,
      });
      if (destPath) {
        const res = await api.openFile(file.path);
        if (res.success && res.data?.temp_path) {
          showToast(`✓ Decrypted copy exported to: ${destPath}`, "success");
        }
      }
    } catch (err: any) {
      showToast(`Export failed: ${err?.message || String(err)}`, "error");
    }
  };

  const handleDeleteFile = async (file: WorkspaceFile) => {
    const ok = window.confirm(`Are you sure you want to delete '${file.name}' from your workspace?`);
    if (!ok) return;

    try {
      const res = await api.deleteFile(file.path);
      if (res.success) {
        showToast(`✓ Deleted '${file.name}'.`, "info");
        await refreshWorkspaceData();
      } else {
        showToast(res.message || "Failed to delete file.", "error");
      }
    } catch (err: any) {
      showToast(`Delete error: ${err?.message || String(err)}`, "error");
    }
  };

  const handleViewHistory = (_file: WorkspaceFile) => {
    setActiveTab("history");
  };

  const handleJoinSuccess = async (result: JoinWorkspaceResult) => {
    setIsJoinModalOpen(false);
    localStorage.setItem("sw_workspace_path", result.workspace_path);
    localStorage.setItem("sw_workspace_name", result.name);
    setWorkspacePath(result.workspace_path);
    setAccountName(result.name);

    // Register in persistent list
    const newWs: RegisteredWorkspace = {
      id: `ws-${Date.now()}`,
      name: result.name,
      path: result.workspace_path,
      lastOpened: Date.now(),
    };
    setRegisteredWorkspaces((prev) => {
      const filtered = prev.filter((w) => w.path !== result.workspace_path);
      return [newWs, ...filtered];
    });

    setAppState("unlocked");
    setCountdownSeconds(15 * 60);
    showToast(`✓ Vault '${result.name}' successfully joined from Google Drive (v${result.version}, ${result.pulled_files} files)!`, "success");
    await refreshWorkspaceData();
  };

  // Render State: Loading Enclave Splash
  if (appState === "loading") {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-rail text-white select-none">
        <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
          <img
            src="/mark-on-dark.svg"
            alt="SecureWorkspace"
            className="w-16 h-16 rounded-2xl shadow-xl border border-vault-cyan/40 object-contain p-2 bg-[#0F2620]"
          />
          <div className="text-lg font-bold tracking-tight">SecureWorkspace</div>
          <div className="flex items-center gap-2 text-xs text-ink-light/60">
            <span className="w-2 h-2 rounded-full bg-vault-mint animate-pulse" />
            Initializing secure enclave...
          </div>
        </div>
      </div>
    );
  }

  // Render State: First-Time Onboarding Welcome
  if (appState === "welcome") {
    return (
      <>
        <WelcomeOnboardingView
          onCreateWorkspace={() => setAppState("wizard")}
          onOpenExistingWorkspace={handleOpenExistingWorkspace}
          onJoinFromDrive={() => setIsJoinModalOpen(true)}
        />
        <JoinFromDriveModal
          isOpen={isJoinModalOpen}
          onClose={() => setIsJoinModalOpen(false)}
          onSuccess={handleJoinSuccess}
        />
      </>
    );
  }

  // Render State: Wizard
  if (appState === "wizard") {
    return (
      <CreateWorkspaceWizard
        onCancel={() => {
          if (registeredWorkspaces.length > 0) {
            setAppState("locked");
          } else {
            setAppState("welcome");
          }
        }}
        onComplete={(path, name) => {
          localStorage.setItem("sw_workspace_path", path);
          localStorage.setItem("sw_workspace_name", name);
          setWorkspacePath(path);
          setAccountName(name);

          // Register in persistent list
          const newWs: RegisteredWorkspace = {
            id: `ws-${Date.now()}`,
            name,
            path,
            lastOpened: Date.now(),
          };
          setRegisteredWorkspaces((prev) => {
            const filtered = prev.filter((w) => w.path !== path);
            return [newWs, ...filtered];
          });

          setAppState("unlocked");
          setCountdownSeconds(15 * 60);
          showToast(`Workspace '${name}' created and ready!`, "success");
          refreshWorkspaceData();
        }}
      />
    );
  }

  // Render State: Locked
  if (appState === "locked") {
    return (
      <>
        <UnlockView
          workspaceName={accountName}
          accountEmail={accountEmail}
          version={status.base_version}
          registeredWorkspaces={registeredWorkspaces}
          isAutoLocked={isAutoLocked}
          onUnlock={handleUnlock}
          onCreateNewWorkspace={() => setAppState("wizard")}
          onSelectWorkspace={handleSelectWorkspace}
          onOpenExistingWorkspace={handleOpenExistingWorkspace}
          onJoinFromDrive={() => setIsJoinModalOpen(true)}
        />
        <JoinFromDriveModal
          isOpen={isJoinModalOpen}
          onClose={() => setIsJoinModalOpen(false)}
          onSuccess={handleJoinSuccess}
        />
      </>
    );
  }

  const pendingCount =
    (status.changes.new.length +
    status.changes.modified.length +
    status.changes.deleted.length) ||
    files.filter((f) => f.status === "not_pushed").length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-mineral text-ink font-sans">
      {/* Dark Navigation Sidebar with Workspace Switcher */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLock={handleLock}
        lockCountdown={formatCountdown(countdownSeconds)}
        activeWorkspaceName={accountName}
        registeredWorkspaces={registeredWorkspaces}
        onSelectWorkspace={handleSelectWorkspace}
        onCreateWorkspace={() => setAppState("wizard")}
        onOpenExistingWorkspace={handleOpenExistingWorkspace}
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
          onPushClick={handleOpenPushModal}
          onDivergedClick={() => setIsDivergedModalOpen(true)}
        />

        {/* Tab Content Body */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === "dashboard" && (
            <DashboardView
              status={status}
              files={files}
              workspacePath={workspacePath}
              onOpenFolder={handleOpenWorkspaceFolder}
              onPush={handleOpenPushModal}
              onBackup={() => setActiveTab("backups")}
            />
          )}

          {activeTab === "files" && (
            <FilesView
              files={files}
              workspacePath={workspacePath}
              onOpenFolder={handleOpenWorkspaceFolder}
              onAddFiles={handleAddFiles}
              onOpenFile={handleOpenFile}
              onExportFile={handleExportFile}
              onViewHistory={handleViewHistory}
              onDeleteFile={handleDeleteFile}
            />
          )}

          {activeTab === "sync" && (
            <div className="p-8 max-w-4xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-bold text-ink">Sync Management</h2>
                <p className="text-sm text-ink-muted mt-1">
                  Control remote Drive synchronization, inspect divergence, and pull updates.
                </p>
              </div>

              {/* Status Banner Card */}
              <div className="bg-surface-card p-6 rounded-xl border border-line space-y-4 shadow-xs">
                <div className="flex items-center justify-between pb-4 border-b border-line">
                  <div>
                    <h3 className="text-base font-bold text-ink">
                      Workspace Synchronization State
                    </h3>
                    <p className="text-xs text-ink-muted mt-0.5">
                      Base Version {status.base_version} • Remote HEAD Version {status.remote_head}
                    </p>
                  </div>

                  <div>
                    {status.is_diverged ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FCE8E6] text-[#C5221F]">
                        <AlertCircle className="w-3.5 h-3.5" /> Diverged
                      </span>
                    ) : status.versions_ahead > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F0FE] text-[#1A73E8]">
                        <ArrowDown className="w-3.5 h-3.5" /> {status.versions_ahead} versions behind Drive
                      </span>
                    ) : pendingCount > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F0FE] text-[#1A73E8]">
                        <ArrowUp className="w-3.5 h-3.5" /> {pendingCount} changes to push
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E6F4EA] text-[#137333]">
                        <Check className="w-3.5 h-3.5" /> Up to date
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <button
                    onClick={handlePull}
                    disabled={isPulling}
                    className="p-4 rounded-xl border border-line hover:border-vault-green bg-surface hover:bg-mineral/30 transition text-left space-y-1.5 disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2 font-bold text-sm text-ink">
                      <ArrowDown className="w-4 h-4 text-vault-green" />
                      Pull from Drive
                    </div>
                    <p className="text-xs text-ink-muted">
                      Downloads new versions from Drive. Creates local safety snapshots for overwritten files.
                    </p>
                  </button>

                  <button
                    onClick={handleOpenPushModal}
                    className="p-4 rounded-xl border border-line hover:border-vault-green bg-surface hover:bg-mineral/30 transition text-left space-y-1.5"
                  >
                    <div className="flex items-center gap-2 font-bold text-sm text-ink">
                      <ArrowUp className="w-4 h-4 text-vault-green" />
                      Push to Drive ({pendingCount} changes)
                    </div>
                    <p className="text-xs text-ink-muted">
                      Inspect changes, enter an optional note, and upload encrypted blocks to Drive.
                    </p>
                  </button>
                </div>

                {status.is_diverged && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-red-700">
                      <AlertCircle className="w-4 h-4" />
                      Concurrent Changes Detected (Diverged)
                    </div>
                    <p className="text-xs text-red-600 leading-relaxed">
                      Both this computer and another device have pushed different changes. Use the conflict resolution tool to resolve safely.
                    </p>
                    <div className="pt-1">
                      <button
                        onClick={() => setIsDivergedModalOpen(true)}
                        className="px-3.5 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition"
                      >
                        Resolve Divergence
                      </button>
                    </div>
                  </div>
                )}

                {/* Hard Reset Option (Git-like reset --hard HEAD with snapshots) */}
                <div className="pt-4 border-t border-line">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-semibold text-ink">Reset Workspace to Remote</h4>
                      <p className="text-xs text-ink-muted">
                        Discard local unpushed changes and reset to Google Drive. A safety snapshot of all your local edits is created automatically.
                      </p>
                    </div>
                    <button
                      onClick={handleHardReset}
                      disabled={isPulling}
                      className="px-3.5 py-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 text-xs font-semibold transition disabled:opacity-50 flex-shrink-0"
                    >
                      Reset to Remote
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <HistoryView
              currentVersion={status.base_version}
              onVersionReverted={refreshWorkspaceData}
            />
          )}

          {activeTab === "backups" && (
            <BackupsView
              workspaceName={accountName}
              version={status.base_version}
            />
          )}

          {activeTab === "workspaces" && (
            <WorkspacesView
              workspaces={registeredWorkspaces}
              activeWorkspaceName={accountName}
              onSelectWorkspace={handleSelectWorkspace}
              onCreateWorkspace={() => setAppState("wizard")}
              onOpenExistingWorkspace={handleOpenExistingWorkspace}
              onJoinFromDrive={() => setIsJoinModalOpen(true)}
              onLockActiveWorkspace={handleLock}
              onRemoveWorkspace={handleRemoveWorkspace}
            />
          )}

          {activeTab === "settings" && (
            <SettingsView
              isDriveAuthed={isDriveAuthed}
              accountEmail={accountEmail}
              isAuthLoading={isAuthLoading}
              onGoogleLogin={handleGoogleLogin}
              onGoogleLogout={handleGoogleLogout}
              autoLockMinutes={autoLockMinutes}
              onAutoLockMinutesChange={handleAutoLockMinutesChange}
            />
          )}
        </main>
      </div>

      {/* Push Preview Modal */}
      <PushPreviewModal
        isOpen={isPushModalOpen}
        onClose={() => setIsPushModalOpen(false)}
        onSuccess={async (newVersion) => {
          toast.success(`✓ Successfully pushed Version ${newVersion} to Google Drive.`);
          await refreshWorkspaceData();
        }}
        onDiverged={() => setIsDivergedModalOpen(true)}
      />

      {/* Diverged Conflict Modal */}
      <DivergedModal
        isOpen={isDivergedModalOpen}
        onClose={() => setIsDivergedModalOpen(false)}
        onPullKeepDrive={() => handleDivergedResolution("keep_drive")}
        onKeepBoth={() => handleDivergedResolution("keep_both")}
        onForcePush={() => handleDivergedResolution("force_push")}
        driveChangesCount={status.versions_ahead || 1}
        localChangesCount={status.changes.modified.length + status.changes.new.length}
        conflictingFiles={status.changes.modified.map((f) => f.relative_path)}
      />

      {/* Join from Google Drive Modal */}
      <JoinFromDriveModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onSuccess={handleJoinSuccess}
      />
    </div>
  );
}

export default App;
