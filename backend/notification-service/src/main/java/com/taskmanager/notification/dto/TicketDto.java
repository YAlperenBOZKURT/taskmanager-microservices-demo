/**
 * DTO for ticket responses - keeps internal mongo fields out of the API
 * @author Yusuf Alperen Bozkurt
 */
package com.taskmanager.notification.dto;

import com.taskmanager.notification.document.Ticket;
import com.taskmanager.notification.document.TicketStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketDto {

    private String id;
    private String senderId;
    private String senderUsername;
    private List<String> receiverIds;
    private List<String> teamIds;
    private String title;
    private String message;
    private TicketStatus status;
    private LocalDateTime createdAt;

    public static TicketDto fromDocument(Ticket ticket) {
        return TicketDto.builder()
                .id(ticket.getId())
                .senderId(ticket.getSenderId())
                .senderUsername(ticket.getSenderUsername())
                .receiverIds(ticket.getReceiverIds())
                .teamIds(ticket.getTeamIds())
                .title(ticket.getTitle())
                .message(ticket.getMessage())
                .status(ticket.getStatus())
                .createdAt(ticket.getCreatedAt())
                .build();
    }
}
