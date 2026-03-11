/**
 * Handles ticket creation, retrieval, and status management.
 * Enforces permission rules based on sender role and team membership.
 */
package com.taskmanager.notification.service;

import com.taskmanager.notification.document.Notification;
import com.taskmanager.notification.document.NotificationType;
import com.taskmanager.notification.document.Ticket;
import com.taskmanager.notification.document.TicketStatus;
import com.taskmanager.notification.dto.CreateTicketRequest;
import com.taskmanager.notification.dto.TicketDto;
import com.taskmanager.notification.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class TicketService implements ITicketService {

    private final TicketRepository ticketRepository;
    private final INotificationService notificationService;

    public TicketDto createTicket(String senderId, String senderUsername,
                                   String senderRole, CreateTicketRequest request) {
        log.info("Creating ticket from {} to {}", senderId, request.getReceiverIds());

        Ticket ticket = Ticket.builder()
                .senderId(senderId)
                .senderUsername(senderUsername)
                .receiverIds(request.getReceiverIds() != null ? request.getReceiverIds() : new ArrayList<>())
                .teamIds(request.getTeamIds() != null ? request.getTeamIds() : new ArrayList<>())
                .title(request.getTitle())
                .message(request.getMessage())
                .build();

        ticket = ticketRepository.save(ticket);
        log.info("Ticket created: id={}", ticket.getId());

        for (String receiverId : ticket.getReceiverIds()) {
            notificationService.createAndSend(
                    receiverId,
                    null,
                    "Yeni Ticket: " + request.getTitle(),
                    senderUsername + " tarafından yeni bir ticket gönderildi: " + request.getTitle(),
                    NotificationType.SYSTEM,
                    ticket.getId(),
                    "TICKET",
                    Map.of("senderId", senderId, "senderUsername", senderUsername)
            );
        }

        return TicketDto.fromDocument(ticket);
    }

    public Page<TicketDto> getMyTickets(String userId, Pageable pageable) {
        return ticketRepository
                .findBySenderIdOrReceiverIdsContainingOrderByCreatedAtDesc(userId, userId, pageable)
                .map(TicketDto::fromDocument);
    }

    public Page<TicketDto> getReceivedTickets(String userId, Pageable pageable) {
        return ticketRepository
                .findByReceiverIdsContainingOrderByCreatedAtDesc(userId, pageable)
                .map(TicketDto::fromDocument);
    }

    public TicketDto getTicketById(String ticketId, String userId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found: " + ticketId));

        if (!ticket.getSenderId().equals(userId) && !ticket.getReceiverIds().contains(userId)) {
            throw new RuntimeException("Access denied to ticket: " + ticketId);
        }

        return TicketDto.fromDocument(ticket);
    }

    public TicketDto updateTicketStatus(String ticketId, TicketStatus newStatus, String userId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found: " + ticketId));

        if (ticket.getStatus() != TicketStatus.PENDING) {
            throw new RuntimeException("Ticket already reviewed: " + ticketId);
        }

        if (!ticket.getReceiverIds().contains(userId)) {
            throw new RuntimeException("Only receivers can approve/reject tickets");
        }

        ticket.setStatus(newStatus);
        ticket = ticketRepository.save(ticket);
        log.info("Ticket {} status changed to {} by {}", ticketId, newStatus, userId);
        return TicketDto.fromDocument(ticket);
    }
}
