// TaskManager Frontend - Authentication service (login, logout, profile)

import api from './api';
import type { AuthResponse } from '../types';

export const authService = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const res = await api.post('/api/auth/login', { username, password });
    return res.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/api/auth/logout');
    } finally {
      // always clear local storage even if the API call fails
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  getMe: async () => {
    const res = await api.get('/api/users/me');
    return res.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const res = await api.post('/api/users/me/change-password', { currentPassword, newPassword });
    return res.data;
  },

  updateMyProfile: async (data: { fullName?: string; email?: string }) => {
    const res = await api.patch('/api/users/me/profile', data);
    return res.data;
  },
};
