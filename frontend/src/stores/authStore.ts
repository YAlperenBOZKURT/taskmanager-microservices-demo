// TaskManager Frontend - Global auth state management with Zustand
// Author: Yusuf Alperen Bozkurt

import { create } from 'zustand';
import type { User } from '../types';
import { Role } from '../types';
import { authService } from '../services/authService';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  setUser: (user: User) => void;
  hasRole: (role: Role) => boolean;
  isSuperAdmin: () => boolean;
  isAdmin: () => boolean;
  isUser: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // try to restore user session from local storage on page refresh
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isLoading: false,

  login: async (username: string, password: string) => {
    set({ isLoading: true });
    try {
      const res = await authService.login(username.trim(), password);
      localStorage.setItem('accessToken', res.accessToken);
      localStorage.setItem('refreshToken', res.refreshToken);
      localStorage.setItem('user', JSON.stringify(res.user));
      set({ user: res.user, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // ignore logout API errors
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      set({ user: null, isAuthenticated: false });
    }
  },

  fetchUser: async () => {
    try {
      // re-fetch user data from server (useful after token refresh)
      const user = await authService.getMe();
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, isAuthenticated: true });
    } catch {
      set({ user: null, isAuthenticated: false });
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  setUser: (user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },

  hasRole: (role: Role) => {
    const { user } = get();
    return user?.roles?.includes(role) ?? false;
  },

  isSuperAdmin: () => get().hasRole(Role.ROLE_SUPER_ADMIN),
  isAdmin: () => get().hasRole(Role.ROLE_ADMIN) || get().hasRole(Role.ROLE_SUPER_ADMIN),
  isUser: () => get().hasRole(Role.ROLE_USER),
}));
