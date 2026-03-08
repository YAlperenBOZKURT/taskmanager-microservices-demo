/**
 * REST API for the support ticket system - create, list, close tickets
 * @author Yusuf Alperen Bozkurt
 */
package com.taskmanager.notification.controller;

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

    // user id and username come from the gateway headers
    @PostMapping
    public ResponseEntity<TicketDto> createTicket(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-Username") String username,
            @Valid @RequestBody CreateTicketRequest request) {
        TicketDto ticket = ticketService.createTicket(userId, username, request);
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
    public ResponseEntity<TicketDto> getTicket(@PathVariable String ticketId) {
        return ResponseEntity.ok(ticketService.getTicketById(ticketId));
    }

    // TODO: could add authorization check - only sender or recipient should close
    @PatchMapping("/{ticketId}/close")
    public ResponseEntity<TicketDto> closeTicket(@PathVariable String ticketId) {
        return ResponseEntity.ok(ticketService.closeTicket(ticketId));
    }
}
