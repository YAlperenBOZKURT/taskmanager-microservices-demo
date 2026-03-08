/**
 * DTO for sending notification data to the frontend
 * @author Yusuf Alperen Bozkurt
 */
package com.taskmanager.notification.dto;

import com.taskmanager.notification.document.Notification;
import com.taskmanager.notification.document.NotificationType;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {

    private String id;
    private String recipientUserId;
    private String title;
    private String message;
    private NotificationType type;
    private boolean read;
    private boolean emailSent;
    private String referenceId;
    private String referenceType;
    private Map<String, Object> metadata;
    private LocalDateTime createdAt;

    public static NotificationDto fromDocument(Notification notification) {
        return NotificationDto.builder()
                .id(notification.getId())
                .recipientUserId(notification.getRecipientUserId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .type(notification.getType())
                .read(notification.isRead())
                .emailSent(notification.isEmailSent())
                .referenceId(notification.getReferenceId())
                .referenceType(notification.getReferenceType())
                .metadata(notification.getMetadata())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
