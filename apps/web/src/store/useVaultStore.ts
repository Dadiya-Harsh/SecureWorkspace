import { create } from 'zustand';
import type { DiscoveredVault } from '../drive/vault-discovery';
import type { VersionManifestData, DecryptedManifestEntry } from '../types/crypto';
import { cryptoClient } from '../crypto/worker/crypto-client';

interface VaultState {
  availableVaults: DiscoveredVault[];
  vault: DiscoveredVault | null;
  isUnlocked: boolean;
  unlockedManifest: VersionManifestData | null;

  // Navigation and exploration
  currentDirectory: string;
  selectedFile: DecryptedManifestEntry | null;
  activeTab: 'files' | 'versions';
  searchQuery: string;

  setAvailableVaults: (vaults: DiscoveredVault[]) => void;
  selectVault: (vault: DiscoveredVault) => void;
  setVault: (vault: DiscoveredVault) => void;
  setUnlocked: (manifest: VersionManifestData) => void;
  setCurrentDirectory: (dir: string) => void;
  setSelectedFile: (file: DecryptedManifestEntry | null) => void;
  setActiveTab: (tab: 'files' | 'versions') => void;
  setSearchQuery: (query: string) => void;

  lockVault: () => Promise<void>;
  reset: () => void;
}

export const useVaultStore = create<VaultState>((set) => ({
  availableVaults: [],
  vault: null,
  isUnlocked: false,
  unlockedManifest: null,

  currentDirectory: '',
  selectedFile: null,
  activeTab: 'files',
  searchQuery: '',

  setAvailableVaults: (availableVaults) => set({ availableVaults }),

  selectVault: (vault) =>
    set({
      vault,
      isUnlocked: false,
      unlockedManifest: null,
      currentDirectory: '',
      selectedFile: null,
    }),

  setVault: (vault) =>
    set({
      vault,
      isUnlocked: false,
      unlockedManifest: null,
      currentDirectory: '',
      selectedFile: null,
    }),

  setUnlocked: (manifest) =>
    set({
      isUnlocked: true,
      unlockedManifest: manifest,
      currentDirectory: '',
      selectedFile: null,
    }),

  setCurrentDirectory: (currentDirectory) => set({ currentDirectory, selectedFile: null }),
  setSelectedFile: (selectedFile) => set({ selectedFile }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  lockVault: async () => {
    try {
      await cryptoClient.lockVault();
    } catch (err) {
      console.warn('Failed to lock worker memory:', err);
    }
    set({
      isUnlocked: false,
      unlockedManifest: null,
      selectedFile: null,
    });
  },

  reset: () => {
    cryptoClient.lockVault().catch(() => {});
    set({
      availableVaults: [],
      vault: null,
      isUnlocked: false,
      unlockedManifest: null,
      currentDirectory: '',
      selectedFile: null,
      activeTab: 'files',
      searchQuery: '',
    });
  },
}));
