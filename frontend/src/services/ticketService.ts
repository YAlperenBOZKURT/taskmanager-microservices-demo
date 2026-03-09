// TaskManager Frontend - Ticket service for support ticket operations
// Author: Yusuf Alperen Bozkurt

import api from './api';
import type { TicketDto, PageResponse } from '../types';

export const ticketService = {
  createTicket: async (data: {
    receiverIds: string[];
    teamIds?: string[];
    title: string;
    message: string;
  }): Promise<TicketDto> => {
    const res = await api.post('/api/tickets', data);
    return res.data;
  },

  getMyTickets: async (page = 0, size = 20, silent = false): Promise<PageResponse<TicketDto>> => {
    const res = await api.get('/api/tickets', { params: { page, size }, ...(silent ? { _silent: true } as never : {}) });
    return res.data;
  },

  getReceivedTickets: async (page = 0, size = 20, silent = false): Promise<PageResponse<TicketDto>> => {
    const res = await api.get('/api/tickets/received', { params: { page, size }, ...(silent ? { _silent: true } as never : {}) });
    return res.data;
  },

  getTicket: async (ticketId: string): Promise<TicketDto> => {
    const res = await api.get(`/api/tickets/${ticketId}`);
    return res.data;
  },

  approveTicket: async (ticketId: string): Promise<TicketDto> => {
    const res = await api.patch(`/api/tickets/${ticketId}/approve`);
    return res.data;
  },

  rejectTicket: async (ticketId: string): Promise<TicketDto> => {
    const res = await api.patch(`/api/tickets/${ticketId}/reject`);
    return res.data;
  },
};
