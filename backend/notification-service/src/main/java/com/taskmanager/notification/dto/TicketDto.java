/**
 * DTO for ticket responses - keeps internal mongo fields out of the API
 * @author Yusuf Alperen Bozkurt
 */
package com.taskmanager.notification.dto;

import com.taskmanager.notification.document.Ticket;
import com.taskmanager.notification.document.TicketStatus;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketDto {

    private String id;
    private String senderId;
    private String senderUsername;
    private String recipientId;
    private String recipientRole;
    private String title;
    private String content;
    private TicketStatus status;
    private LocalDateTime createdAt;

    public static TicketDto fromDocument(Ticket ticket) {
        return TicketDto.builder()
                .id(ticket.getId())
                .senderId(ticket.getSenderId())
                .senderUsername(ticket.getSenderUsername())
                .recipientId(ticket.getRecipientId())
                .recipientRole(ticket.getRecipientRole())
                .title(ticket.getTitle())
                .content(ticket.getContent())
                .status(ticket.getStatus())
                .createdAt(ticket.getCreatedAt())
                .build();
    }
}
