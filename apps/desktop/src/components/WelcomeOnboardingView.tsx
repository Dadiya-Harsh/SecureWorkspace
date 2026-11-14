import React from "react";
import { ShieldCheck, Plus, FolderOpen, KeyRound, Cloud, Lock } from "lucide-react";

interface WelcomeOnboardingViewProps {
  onCreateWorkspace: () => void;
  onOpenExistingWorkspace: () => void;
}

export const WelcomeOnboardingView: React.FC<WelcomeOnboardingViewProps> = ({
  onCreateWorkspace,
  onOpenExistingWorkspace,
}) => {
  return (
    <div className="min-h-screen w-full flex select-none bg-surface">
      {/* Left Security Hero Panel */}
      <div className="hidden lg:flex w-5/12 bg-rail text-ink-light flex-col justify-between p-12 border-r border-line-dark/40">
        <div>
          <div className="flex items-center gap-3 text-white font-semibold text-lg">
            <img
              src="/logo.png"
              alt="SecureWorkspace"
              className="w-9 h-9 rounded-xl border border-vault-cyan/30 shadow-md object-cover"
            />
            SecureWorkspace
          </div>

          <div className="mt-20 space-y-6">
            <div className="inline-block relative">
              <img
                src="/logo.png"
                alt="SecureWorkspace"
                className="w-20 h-20 rounded-2xl shadow-xl shadow-cyan-950/60 border border-vault-cyan/40 object-cover"
              />
              <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 text-xs font-bold rounded-full bg-rail border border-vault-mint/40 text-vault-mint shadow">
                v1.0
              </span>
            </div>

            <h1 className="text-3xl font-bold text-white tracking-tight leading-snug">
              Zero knowledge.<br />
              Google cannot read your files.
            </h1>

            <p className="text-ink-light/70 text-sm leading-relaxed max-w-sm">
              Your files and directory structures are encrypted on this device with libsodium XChaCha20-Poly1305 and Argon2id before reaching the cloud.
            </p>
          </div>
        </div>

        <div className="space-y-3 border-t border-line-dark/40 pt-6">
          <div className="flex items-center gap-2.5 text-xs text-ink-light/70">
            <KeyRound className="w-4 h-4 text-vault-cyan flex-shrink-0" />
            <span>Master key derived locally with Argon2id memory-hard hashing</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-ink-light/70">
            <Cloud className="w-4 h-4 text-vault-mint flex-shrink-0" />
            <span>Zero plaintext in transit to Google Drive or at rest on disk</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-ink-light/50">
            <ShieldCheck className="w-4 h-4 text-vault-mint flex-shrink-0" />
            <span>24-word BIP-39 emergency cold recovery support</span>
          </div>
        </div>
      </div>

      {/* Right Onboarding Selection Panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-12">
        <div className="w-full max-w-lg space-y-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-vault-cyan bg-vault-cyan/10 px-3 py-1 rounded-full border border-vault-cyan/20">
              First-Time Setup
            </span>
            <h2 className="text-2xl font-bold text-ink mt-3">Welcome to SecureWorkspace</h2>
            <p className="text-sm text-ink-muted mt-1 leading-relaxed">
              To begin, create a new encrypted vault or link an existing workspace folder.
            </p>
          </div>

          <div className="space-y-4">
            {/* Card 1: Create New Workspace (Primary) */}
            <div
              onClick={onCreateWorkspace}
              className="group p-6 rounded-2xl border-2 border-vault-mint/40 bg-surface-card hover:border-vault-mint hover:shadow-lg transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-vault-mint/10 border border-vault-mint/30 text-vault-mint flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Plus className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-ink group-hover:text-vault-mint transition-colors">
                      Create New Encrypted Workspace
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-vault-mint/15 text-vault-mint border border-vault-mint/25">
                      New Users
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted mt-1.5 leading-relaxed">
                    Set up a new zero-knowledge vault folder on this computer. You will choose a folder location, set a master password, and receive a 24-word recovery key.
                  </p>
                  <div className="mt-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-vault-mint group-hover:translate-x-1 transition-transform">
                      Set Up New Vault &rarr;
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Open Existing Workspace (Secondary) */}
            <div
              onClick={onOpenExistingWorkspace}
              className="group p-6 rounded-2xl border border-line bg-surface-card hover:border-line-dark hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-mineral/40 border border-line text-ink flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <FolderOpen className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-ink group-hover:text-ink transition-colors">
                    Open Existing Workspace
                  </h3>
                  <p className="text-xs text-ink-muted mt-1.5 leading-relaxed">
                    Already have an encrypted vault folder on an external drive, USB, or Google Drive? Select the folder to register and unlock it.
                  </p>
                  <div className="mt-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted group-hover:text-ink transition-colors">
                      Browse Folder Location &rarr;
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-mineral/20 border border-line text-xs text-ink-muted leading-relaxed flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-ink-muted flex-shrink-0" />
            <span>
              All workspaces are completely isolated cryptographic containers. You can manage multiple vaults at any time.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
