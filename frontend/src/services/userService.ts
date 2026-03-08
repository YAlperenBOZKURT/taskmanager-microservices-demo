// TaskManager Frontend - User service for admin user management
// Author: Yusuf Alperen Bozkurt

import api from './api';
import type { User, PageResponse } from '../types';

export const userService = {
  getAllUsers: async (page = 0, size = 20): Promise<PageResponse<User>> => {
    const res = await api.get('/api/admin/users', { params: { page, size } });
    return res.data;
  },

  getUserById: async (userId: string): Promise<User> => {
    const res = await api.get(`/api/admin/users/${userId}`);
    return res.data;
  },

  getUsersByTeam: async (team: string, page = 0, size = 20): Promise<PageResponse<User>> => {
    const res = await api.get('/api/admin/users/by-team', { params: { team, page, size } });
    return res.data;
  },

  toggleUserStatus: async (userId: string, enabled: boolean): Promise<User> => {
    const res = await api.patch(`/api/admin/users/${userId}/status`, { enabled });
    return res.data;
  },

  assignRoles: async (userId: string, roles: string[]): Promise<User> => {
    const res = await api.put(`/api/admin/users/${userId}/roles`, { roles });
    return res.data;
  },

  updateUserTeam: async (userId: string, team: string): Promise<User> => {
    const res = await api.patch(`/api/admin/users/${userId}/team`, { team });
    return res.data;
  },

  updateUserProfile: async (userId: string, data: { fullName?: string; email?: string; team?: string }): Promise<User> => {
    const res = await api.patch(`/api/admin/users/${userId}/profile`, data);
    return res.data;
  },

  createUser: async (data: {
    username: string;
    email: string;
    password: string;
    fullName?: string;
    team?: string;
    roles?: string[];
  }): Promise<User> => {
    const res = await api.post('/api/admin/users', data);
    return res.data;
  },

  deleteUser: async (userId: string) => {
    const res = await api.delete(`/api/admin/users/${userId}`);
    return res.data;
  },
};
