/**
 * MongoDB document for support tickets between users
 */
package com.taskmanager.notification.document;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "tickets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ticket {

    @Id
    private String id;

    @Indexed
    private String senderId;

    private String senderUsername;

    @Indexed
    @Builder.Default
    private List<String> receiverIds = new ArrayList<>();

    @Builder.Default
    private List<String> teamIds = new ArrayList<>();

    private String title;

    private String message;

    @Builder.Default
    private TicketStatus status = TicketStatus.PENDING;

    @CreatedDate
    private LocalDateTime createdAt;
}
