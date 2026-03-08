// TaskManager Frontend - Notification service for fetching and managing notifications
// Author: Yusuf Alperen Bozkurt

import api from './api';
import type { NotificationDto, PageResponse } from '../types';

export const notificationService = {
  getNotifications: async (page = 0, size = 20): Promise<PageResponse<NotificationDto>> => {
    const res = await api.get('/api/notifications', { params: { page, size } });
    return res.data;
  },

  getUnread: async (): Promise<NotificationDto[]> => {
    const res = await api.get('/api/notifications/unread');
    return res.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await api.get('/api/notifications/unread/count');
    return res.data.count;
  },

  markAsRead: async (notificationId: string): Promise<NotificationDto> => {
    const res = await api.patch(`/api/notifications/${notificationId}/read`);
    return res.data;
  },

  markAllAsRead: async () => {
    const res = await api.patch('/api/notifications/read-all');
    return res.data;
  },
};
