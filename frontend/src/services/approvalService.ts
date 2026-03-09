// TaskManager Frontend - Approval service for task approval workflows

import api from './api';
import type { TaskApprovalRequestDto, PageResponse } from '../types';

export const approvalService = {
  getPendingApprovals: async (page = 0, size = 20): Promise<PageResponse<TaskApprovalRequestDto>> => {
    const res = await api.get('/api/tasks/approvals/pending', { params: { page, size } });
    return res.data;
  },

  getAllApprovals: async (page = 0, size = 20): Promise<PageResponse<TaskApprovalRequestDto>> => {
    const res = await api.get('/api/tasks/approvals/all', { params: { page, size } });
    return res.data;
  },

  getMyApprovalRequests: async (page = 0, size = 20): Promise<PageResponse<TaskApprovalRequestDto>> => {
    const res = await api.get('/api/tasks/approvals/my-requests', { params: { page, size } });
    return res.data;
  },

  reviewApproval: async (requestId: string, status: 'APPROVED' | 'REJECTED', reviewNote?: string) => {
    const res = await api.post(`/api/tasks/approvals/${requestId}/review`, { status, reviewNote });
    return res.data;
  },
};
