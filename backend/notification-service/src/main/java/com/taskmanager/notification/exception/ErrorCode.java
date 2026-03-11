package com.taskmanager.notification.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // Notification errors
    NOTIFICATION_NOT_FOUND("NOTIF_001", "Notification not found", HttpStatus.NOT_FOUND),

    // Ticket errors
    TICKET_NOT_FOUND("TICKET_001", "Ticket not found", HttpStatus.NOT_FOUND),
    TICKET_ACCESS_DENIED("TICKET_002", "Access denied to ticket", HttpStatus.FORBIDDEN),
    TICKET_ALREADY_REVIEWED("TICKET_003", "Ticket already reviewed", HttpStatus.BAD_REQUEST),
    TICKET_NOT_RECEIVER("TICKET_004", "Only receivers can approve/reject tickets", HttpStatus.FORBIDDEN),

    // General
    VALIDATION_FAILED("GEN_002", "Validation failed", HttpStatus.BAD_REQUEST),
    INTERNAL_ERROR("GEN_999", "An unexpected error occurred", HttpStatus.INTERNAL_SERVER_ERROR);

    private final String code;
    private final String defaultMessage;
    private final HttpStatus httpStatus;
}
