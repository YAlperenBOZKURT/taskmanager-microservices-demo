// TaskManager Frontend - Task service for CRUD operations on tasks
// Author: Yusuf Alperen Bozkurt

import api from './api';
import type { TaskDto, PageResponse } from '../types';

export const taskService = {
  getTasks: async (page = 0, size = 20): Promise<PageResponse<TaskDto>> => {
    const res = await api.get('/api/tasks', { params: { page, size } });
    return res.data;
  },

  getMyTasks: async (page = 0, size = 20): Promise<PageResponse<TaskDto>> => {
    const res = await api.get('/api/tasks/my-tasks', { params: { page, size } });
    return res.data;
  },

  getAssignedToMe: async (page = 0, size = 20): Promise<PageResponse<TaskDto>> => {
    const res = await api.get('/api/tasks/assigned-to-me', { params: { page, size } });
    return res.data;
  },

  getTasksByTeamLeader: async (teamLeaderId: string, page = 0, size = 20): Promise<PageResponse<TaskDto>> => {
    const res = await api.get(`/api/tasks/by-team-leader/${teamLeaderId}`, { params: { page, size } });
    return res.data;
  },

  getTasksByStatus: async (status: string, page = 0, size = 20): Promise<PageResponse<TaskDto>> => {
    const res = await api.get(`/api/tasks/by-status/${status}`, { params: { page, size } });
    return res.data;
  },

  getTask: async (taskId: string): Promise<TaskDto> => {
    const res = await api.get(`/api/tasks/${taskId}`);
    return res.data;
  },

  createTask: async (data: {
    title: string;
    description?: string;
    priority?: string;
    teamLeaderId?: string;
    assigneeIds?: string[];
    dueDate?: string;
  }) => {
    const res = await api.post('/api/tasks', data);
    return res.data;
  },

  updateTask: async (taskId: string, data: {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    teamLeaderId?: string;
    assigneeIds?: string[];
    dueDate?: string;
  }) => {
    const res = await api.put(`/api/tasks/${taskId}`, data);
    return res.data;
  },

  deleteTask: async (taskId: string) => {
    await api.delete(`/api/tasks/${taskId}`);
  },

  assignTask: async (taskId: string, assigneeIds: string[]) => {
    const res = await api.post(`/api/tasks/${taskId}/assign`, { assigneeIds });
    return res.data;
  },
};
