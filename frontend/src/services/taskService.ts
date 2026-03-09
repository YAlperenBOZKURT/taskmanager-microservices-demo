// TaskManager Frontend - Task service for CRUD operations on tasks

import api from './api';
import type { TaskDto, AttachmentDto, TaskProgressEntryDto, PageResponse } from '../types';

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
    team?: string;
    priority?: string;
    assigneeIds?: string[];
    dueDate?: string;
  }) => {
    const res = await api.post('/api/tasks', data);
    return res.data;
  },

  updateTask: async (taskId: string, data: {
    title?: string;
    description?: string;
    team?: string;
    priority?: string;
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

  markTaskPending: async (taskId: string): Promise<TaskDto> => {
    const res = await api.post(`/api/tasks/${taskId}/mark-pending`);
    return res.data;
  },

  approveCompletion: async (taskId: string): Promise<TaskDto> => {
    const res = await api.post(`/api/tasks/${taskId}/approve-completion`);
    return res.data;
  },

  completeTask: async (taskId: string, message?: string): Promise<unknown> => {
    const res = await api.post(`/api/tasks/${taskId}/complete`, message ? { message } : {});
    return res.data;
  },

  addProgressEntry: async (taskId: string, message: string): Promise<TaskProgressEntryDto> => {
    const res = await api.post(`/api/tasks/${taskId}/progress`, { message });
    return res.data;
  },

  getProgressEntries: async (taskId: string): Promise<TaskProgressEntryDto[]> => {
    const res = await api.get(`/api/tasks/${taskId}/progress`);
    return res.data;
  },

  uploadAttachment: async (taskId: string, file: File): Promise<AttachmentDto> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post(`/api/tasks/${taskId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  getAttachments: async (taskId: string): Promise<AttachmentDto[]> => {
    const res = await api.get(`/api/tasks/${taskId}/attachments`);
    return res.data;
  },

  deleteAttachment: async (attachmentId: string) => {
    await api.delete(`/api/tasks/attachments/${attachmentId}`);
  },
};
