/**
 * Core notification logic - creates notifications, sends emails, and handles read/unread state
 */
package com.taskmanager.notification.service;

import com.taskmanager.notification.document.Notification;
import com.taskmanager.notification.document.NotificationType;
import com.taskmanager.notification.dto.NotificationDto;
import com.taskmanager.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final EmailService emailService;

    public Notification createAndSend(String recipientUserId,
                                       String recipientEmail,
                                       String title,
                                       String message,
                                       NotificationType type,
                                       String referenceId,
                                       String referenceType,
                                       Map<String, Object> metadata) {

        // build the notification object and persist it
        Notification notification = Notification.builder()
                .recipientUserId(recipientUserId)
                .recipientEmail(recipientEmail)
                .title(title)
                .message(message)
                .type(type)
                .referenceId(referenceId)
                .referenceType(referenceType)
                .metadata(metadata)
                .build();

        notification = notificationRepository.save(notification);
        log.info("Notification saved: id={}, type={}, recipient={}", notification.getId(), type, recipientUserId);

        // fire off an email if we have an address to send to
        if (recipientEmail != null && !recipientEmail.isBlank()) {
            emailService.sendEmail(recipientEmail, title, buildEmailHtml(title, message));
            notification.setEmailSent(true);
            notificationRepository.save(notification);
        }

        return notification;
    }

    public Page<NotificationDto> getNotifications(String userId, Pageable pageable) {
        return notificationRepository.findByRecipientUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(NotificationDto::fromDocument);
    }

    public List<NotificationDto> getUnreadNotifications(String userId) {
        return notificationRepository.findByRecipientUserIdAndReadFalseOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationDto::fromDocument)
                .toList();
    }

    public long getUnreadCount(String userId) {
        return notificationRepository.countByRecipientUserIdAndReadFalse(userId);
    }

    public NotificationDto markAsRead(String notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found: " + notificationId));
        notification.setRead(true);
        notification = notificationRepository.save(notification);
        return NotificationDto.fromDocument(notification);
    }

    public void markAllAsRead(String userId) {
        // mark all as read in one go
        List<Notification> unread = notificationRepository
                .findByRecipientUserIdAndReadFalseOrderByCreatedAtDesc(userId);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
        log.info("Marked {} notifications as read for userId={}", unread.size(), userId);
    }

    // build a simple html email template - nothing fancy, just gets the job done
    private String buildEmailHtml(String title, String message) {
        return """
                <!DOCTYPE html>
                <html>
                <head><meta charset="UTF-8"></head>
                <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
                  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h2 style="color: #333; margin-top: 0;">%s</h2>
                    <div style="color: #555; line-height: 1.6;">%s</div>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #999; font-size: 12px;">TaskManager Notification System</p>
                  </div>
                </body>
                </html>
                """.formatted(title, message);
    }
}
