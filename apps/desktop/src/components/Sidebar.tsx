import React, { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard,
  FolderLock,
  RefreshCw,
  History,
  HardDrive,
  Settings,
  Lock,
  Clock,
  ChevronDown,
  Check,
  Plus,
  FolderOpen,
  LogOut,
  Layers,
} from "lucide-react";
import { RegisteredWorkspace } from "../api/types";

export type NavTab = "dashboard" | "files" | "sync" | "history" | "backups" | "workspaces" | "settings";

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onLock: () => void;
  lockCountdown: string;
  activeWorkspaceName: string;
  registeredWorkspaces: RegisteredWorkspace[];
  onSelectWorkspace: (workspace: RegisteredWorkspace) => void;
  onCreateWorkspace: () => void;
  onOpenExistingWorkspace: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onLock,
  lockCountdown,
  activeWorkspaceName,
  registeredWorkspaces,
  onSelectWorkspace,
  onCreateWorkspace,
  onOpenExistingWorkspace,
}) => {
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsSwitcherOpen(false);
      }
    };
    if (isSwitcherOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSwitcherOpen]);

  const navItems = [
    { id: "dashboard" as NavTab, label: "Dashboard", icon: LayoutDashboard },
    { id: "files" as NavTab, label: "Files", icon: FolderLock },
    { id: "sync" as NavTab, label: "Sync", icon: RefreshCw },
    { id: "history" as NavTab, label: "History", icon: History },
    { id: "backups" as NavTab, label: "Backups", icon: HardDrive },
    { id: "workspaces" as NavTab, label: "Workspaces", icon: Layers },
    { id: "settings" as NavTab, label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-rail text-ink-light flex flex-col justify-between h-screen select-none border-r border-line-dark/40 relative z-30">
      <div>
        {/* Interactive Workspace Switcher Header */}
        <div className="relative p-4 border-b border-line-dark/30" ref={dropdownRef}>
          <button
            onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-rail-hover transition group text-left"
          >
            <div className="flex items-center gap-2.5 truncate">
              <span className="w-2.5 h-2.5 rounded-full bg-vault-mint inline-block flex-shrink-0 animate-pulse" />
              <div className="truncate">
                <div className="text-xs font-semibold uppercase tracking-wider text-ink-light/50">
                  Workspace
                </div>
                <div className="text-sm font-bold text-white truncate">
                  {activeWorkspaceName}
                </div>
              </div>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-ink-light/50 transition-transform duration-200 ${
                isSwitcherOpen ? "rotate-180 text-white" : "group-hover:text-white"
              }`}
            />
          </button>

          {/* Switcher Dropdown Menu */}
          {isSwitcherOpen && (
            <div className="absolute top-full left-4 right-4 mt-1 bg-[#142420] border border-line-dark/60 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="text-[10px] font-bold uppercase tracking-wider text-ink-light/40 px-2.5 py-1.5">
                Switch Workspace
              </div>

              {/* Workspaces List */}
              <div className="space-y-0.5 max-h-48 overflow-y-auto">
                {registeredWorkspaces.map((ws) => {
                  const isActive = ws.name === activeWorkspaceName;
                  return (
                    <button
                      key={ws.path}
                      onClick={() => {
                        setIsSwitcherOpen(false);
                        if (!isActive) onSelectWorkspace(ws);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition ${
                        isActive
                          ? "bg-rail-active text-white"
                          : "text-ink-light/80 hover:bg-rail-hover hover:text-white"
                      }`}
                    >
                      <div className="truncate text-left pr-2">
                        <div className="font-semibold truncate">{ws.name}</div>
                        <div className="text-[10px] text-ink-light/40 font-mono truncate">
                          {ws.path}
                        </div>
                      </div>
                      {isActive && <Check className="w-3.5 h-3.5 text-vault-mint flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="my-1.5 border-t border-line-dark/40" />

              {/* Action items */}
              <button
                onClick={() => {
                  setIsSwitcherOpen(false);
                  onCreateWorkspace();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-ink-light/90 hover:bg-rail-hover hover:text-white transition"
              >
                <Plus className="w-3.5 h-3.5 text-vault-mint" />
                Create New Workspace
              </button>

              <button
                onClick={() => {
                  setIsSwitcherOpen(false);
                  onOpenExistingWorkspace();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-ink-light/90 hover:bg-rail-hover hover:text-white transition"
              >
                <FolderOpen className="w-3.5 h-3.5 text-vault-mint" />
                Open Existing Folder...
              </button>

              <button
                onClick={() => {
                  setIsSwitcherOpen(false);
                  onLock();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                Lock & Switch
              </button>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-rail-active text-white shadow-sm"
                    : "text-ink-light/75 hover:bg-rail-hover hover:text-white"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-vault-mint" : "text-ink-light/60"}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Session Auto-Lock Countdown */}
      <div className="p-4 border-t border-line-dark/30 bg-rail/80">
        <div className="flex items-center justify-between text-xs text-ink-light/60 mb-2">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-ink-light/40" />
            Auto-locks in {lockCountdown}
          </span>
          <button
            onClick={onLock}
            title="Lock workspace immediately"
            className="p-1 hover:bg-rail-hover hover:text-white rounded transition text-ink-light/50"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
