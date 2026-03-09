/**
 * REST API for the support ticket system - create, list, approve/reject tickets.
 * Permission matrix:
 *   USER  → same team users/admins + any super admin
 *   ADMIN → same team users/admins + any super admin
 *   SUPER_ADMIN → anyone
 * @author Yusuf Alperen Bozkurt
 */
package com.taskmanager.notification.controller;

import com.taskmanager.notification.document.TicketStatus;
import com.taskmanager.notification.dto.CreateTicketRequest;
import com.taskmanager.notification.dto.TicketDto;
import com.taskmanager.notification.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @PostMapping
    public ResponseEntity<TicketDto> createTicket(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-Username") String username,
            @RequestHeader(value = "X-User-Roles", defaultValue = "") String roles,
            @Valid @RequestBody CreateTicketRequest request) {
        TicketDto ticket = ticketService.createTicket(userId, username, roles, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ticket);
    }

    @GetMapping
    public ResponseEntity<Page<TicketDto>> getMyTickets(
            @RequestHeader("X-User-Id") String userId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ticketService.getMyTickets(userId, pageable));
    }

    @GetMapping("/received")
    public ResponseEntity<Page<TicketDto>> getReceivedTickets(
            @RequestHeader("X-User-Id") String userId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ticketService.getReceivedTickets(userId, pageable));
    }

    @GetMapping("/{ticketId}")
    public ResponseEntity<TicketDto> getTicket(
            @PathVariable String ticketId,
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(ticketService.getTicketById(ticketId, userId));
    }

    @PatchMapping("/{ticketId}/approve")
    public ResponseEntity<TicketDto> approveTicket(
            @PathVariable String ticketId,
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(ticketService.updateTicketStatus(ticketId, TicketStatus.APPROVED, userId));
    }

    @PatchMapping("/{ticketId}/reject")
    public ResponseEntity<TicketDto> rejectTicket(
            @PathVariable String ticketId,
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(ticketService.updateTicketStatus(ticketId, TicketStatus.REJECTED, userId));
    }
}
