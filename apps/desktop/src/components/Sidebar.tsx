import React from "react";
import {
  LayoutDashboard,
  FolderLock,
  RefreshCw,
  History,
  HardDrive,
  Settings,
  Lock,
  Clock,
} from "lucide-react";

export type NavTab = "dashboard" | "files" | "sync" | "history" | "backups" | "settings";

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onLock: () => void;
  lockCountdown: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onLock,
  lockCountdown,
}) => {
  const navItems = [
    { id: "dashboard" as NavTab, label: "Dashboard", icon: LayoutDashboard },
    { id: "files" as NavTab, label: "Files", icon: FolderLock },
    { id: "sync" as NavTab, label: "Sync", icon: RefreshCw },
    { id: "history" as NavTab, label: "History", icon: History },
    { id: "backups" as NavTab, label: "Backups", icon: HardDrive },
    { id: "settings" as NavTab, label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-rail text-ink-light flex flex-col justify-between h-screen select-none border-r border-line-dark/40">
      <div>
        {/* App Brand Header */}
        <div className="px-6 py-6 border-b border-line-dark/30 flex items-center justify-between">
          <span className="text-lg font-semibold tracking-tight text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-vault-mint inline-block" />
            SecureWorkspace
          </span>
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
