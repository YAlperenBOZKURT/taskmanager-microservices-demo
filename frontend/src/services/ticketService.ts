// TaskManager Frontend - Ticket service for support ticket operations
// Author: Yusuf Alperen Bozkurt

import api from './api';
import type { TicketDto, PageResponse } from '../types';

export const ticketService = {
  createTicket: async (data: {
    recipientId: string;
    recipientRole?: string;
    title: string;
    content: string;
  }): Promise<TicketDto> => {
    const res = await api.post('/api/tickets', data);
    return res.data;
  },

  getMyTickets: async (page = 0, size = 20): Promise<PageResponse<TicketDto>> => {
    const res = await api.get('/api/tickets', { params: { page, size } });
    return res.data;
  },

  getReceivedTickets: async (page = 0, size = 20): Promise<PageResponse<TicketDto>> => {
    const res = await api.get('/api/tickets/received', { params: { page, size } });
    return res.data;
  },

  getTicket: async (ticketId: string): Promise<TicketDto> => {
    const res = await api.get(`/api/tickets/${ticketId}`);
    return res.data;
  },

  closeTicket: async (ticketId: string): Promise<TicketDto> => {
    const res = await api.patch(`/api/tickets/${ticketId}/close`);
    return res.data;
  },
};
