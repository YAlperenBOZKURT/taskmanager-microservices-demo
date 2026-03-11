package com.taskmanager.notification.service;

import com.taskmanager.notification.document.TicketStatus;
import com.taskmanager.notification.dto.CreateTicketRequest;
import com.taskmanager.notification.dto.TicketDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ITicketService {

    TicketDto createTicket(String senderId, String senderUsername,
                           String senderRole, CreateTicketRequest request);

    Page<TicketDto> getMyTickets(String userId, Pageable pageable);

    Page<TicketDto> getReceivedTickets(String userId, Pageable pageable);

    TicketDto getTicketById(String ticketId, String userId);

    TicketDto updateTicketStatus(String ticketId, TicketStatus newStatus, String userId);
}
