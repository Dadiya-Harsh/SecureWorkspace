import { create } from 'zustand';
import type { GoogleUserInfo } from '../types/drive';

interface AuthState {
  accessToken: string | null;
  userEmail: string | null;
  userName: string | null;
  userPicture: string | null;
  isAuthenticated: boolean;

  setAuth: (token: string, user: GoogleUserInfo) => void;
  disconnect: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  userEmail: null,
  userName: null,
  userPicture: null,
  isAuthenticated: false,

  setAuth: (accessToken: string, user: GoogleUserInfo) =>
    set({
      accessToken,
      userEmail: user.email,
      userName: user.name || null,
      userPicture: user.picture || null,
      isAuthenticated: true,
    }),

  disconnect: () =>
    set({
      accessToken: null,
      userEmail: null,
      userName: null,
      userPicture: null,
      isAuthenticated: false,
    }),
}));
