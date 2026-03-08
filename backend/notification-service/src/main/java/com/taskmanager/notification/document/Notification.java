/**
 * MongoDB document for notifications - stores everything we need to show and track a notification
 * @author Yusuf Alperen Bozkurt
 */
package com.taskmanager.notification.document;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.Map;

@Document(collection = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    private String id;

    @Indexed
    private String recipientUserId;

    private String recipientEmail;

    private String title;

    private String message;

    private NotificationType type;

    @Builder.Default
    private boolean read = false;

    @Builder.Default
    private boolean emailSent = false;

    private String referenceId;

    private String referenceType;

    private Map<String, Object> metadata;

    @CreatedDate
    private LocalDateTime createdAt;
}
