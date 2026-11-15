import { create } from 'zustand';

interface SecurityState {
  remainingSeconds: number;
  initialSeconds: number;
  isPaused: boolean;
  
  resetTimer: () => void;
  decrement: () => number; // returns updated seconds
  setPaused: (paused: boolean) => void;
}

export const useSecurityStore = create<SecurityState>((set, get) => ({
  remainingSeconds: 600, // 10 minutes default
  initialSeconds: 600,
  isPaused: false,

  resetTimer: () => {
    set({ remainingSeconds: get().initialSeconds });
  },

  decrement: () => {
    const next = Math.max(0, get().remainingSeconds - 1);
    set({ remainingSeconds: next });
    return next;
  },

  setPaused: (isPaused: boolean) => set({ isPaused }),
}));

export function formatRemainingTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
