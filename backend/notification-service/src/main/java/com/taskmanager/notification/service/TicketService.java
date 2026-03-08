/**
 * Handles ticket creation, retrieval, and closing - basically a mini support system
 * @author Yusuf Alperen Bozkurt
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

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final NotificationService notificationService;

    public TicketDto createTicket(String senderId, String senderUsername, CreateTicketRequest request) {
        log.info("Creating ticket from {} to {}", senderId, request.getRecipientId());

        // build and save the ticket first
        Ticket ticket = Ticket.builder()
                .senderId(senderId)
                .senderUsername(senderUsername)
                .recipientId(request.getRecipientId())
                .recipientRole(request.getRecipientRole())
                .title(request.getTitle())
                .content(request.getContent())
                .build();

        ticket = ticketRepository.save(ticket);
        log.info("Ticket created: id={}", ticket.getId());

        // then notify the recipient about the new ticket
        notificationService.createAndSend(
                request.getRecipientId(),
                null,
                "Yeni Ticket: " + request.getTitle(),
                senderUsername + " tarafından yeni bir ticket gönderildi: " + request.getTitle(),
                NotificationType.SYSTEM,
                ticket.getId(),
                "TICKET",
                Map.of("senderId", senderId, "senderUsername", senderUsername)
        );

        return TicketDto.fromDocument(ticket);
    }

    // grabs both sent and received tickets for the user
    public Page<TicketDto> getMyTickets(String userId, Pageable pageable) {
        return ticketRepository
                .findBySenderIdOrRecipientIdOrderByCreatedAtDesc(userId, userId, pageable)
                .map(TicketDto::fromDocument);
    }

    public Page<TicketDto> getReceivedTickets(String userId, Pageable pageable) {
        return ticketRepository
                .findByRecipientIdOrderByCreatedAtDesc(userId, pageable)
                .map(TicketDto::fromDocument);
    }

    public TicketDto getTicketById(String ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found: " + ticketId));
        return TicketDto.fromDocument(ticket);
    }

    public TicketDto closeTicket(String ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found: " + ticketId));
        ticket.setStatus(TicketStatus.CLOSED);
        ticket = ticketRepository.save(ticket);
        log.info("Ticket closed: id={}", ticketId);
        return TicketDto.fromDocument(ticket);
    }
}
