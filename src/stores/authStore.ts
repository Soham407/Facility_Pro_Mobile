import { create } from 'zustand';
import type { AppUser, AppRole, AuthState } from '../types/auth';

interface AuthStore extends AuthState {
  setUser: (user: AppUser | null) => void;
  setRole: (role: AppRole | null) => void;
  setSession: (session: { access_token: string; refresh_token: string } | null) => void;
  setLoading: (loading: boolean) => void;
  login: (user: AppUser, role: AppRole, session: { access_token: string; refresh_token: string }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  role: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setRole: (role) => set({ role }),
  setSession: (session) => set({ session }),
  setLoading: (isLoading) => set({ isLoading }),

  login: (user, role, session) =>
    set({
      user,
      role,
      session,
      isAuthenticated: true,
      isLoading: false,
    }),

  logout: () =>
    set({
      user: null,
      role: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
    }),
}));
