/**
 * MongoDB document for support tickets between users
 * @author Yusuf Alperen Bozkurt
 */
package com.taskmanager.notification.document;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

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
    private String recipientId;

    private String recipientRole;

    private String title;

    private String content;

    @Builder.Default
    private TicketStatus status = TicketStatus.OPEN;

    @CreatedDate
    private LocalDateTime createdAt;
}
