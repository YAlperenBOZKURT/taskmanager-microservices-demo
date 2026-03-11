/**
 * Listens for user-related kafka events (registration, profile updates) and sends notifications
 */
package com.taskmanager.notification.consumer;

import com.taskmanager.notification.config.KafkaConfig;
import com.taskmanager.notification.document.NotificationType;
import com.taskmanager.notification.event.UserEvent;
import com.taskmanager.notification.service.INotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class UserEventConsumer {

    private final INotificationService notificationService;

    // listen for new user registrations from auth-service
    @KafkaListener(topics = KafkaConfig.USER_REGISTERED_TOPIC, groupId = "notification-service-group")
    public void handleUserRegistered(Map<String, Object> event) {
        // kafka sends raw maps for user events, so we convert manually
        UserEvent userEvent = UserEvent.fromMap(event);
        log.info("Received USER_REGISTERED event: userId={}, username={}", userEvent.getUserId(), userEvent.getUsername());

        try {
            String title = "Hesabiniz Olusturuldu";
            String message = String.format(
                    "Merhaba <strong>%s</strong>,<br><br>"
                    + "TaskManager sistemine basariyla kayit oldunuz. "
                    + "Kullanici adiniz: <strong>%s</strong><br><br>"
                    + "Sisteme giris yaparak gorevlerinizi takip edebilirsiniz.",
                    userEvent.getFullName() != null ? userEvent.getFullName() : userEvent.getUsername(),
                    userEvent.getUsername()
            );

            notificationService.createAndSend(
                    userEvent.getUserId(),
                    userEvent.getEmail(),
                    title,
                    message,
                    NotificationType.USER_REGISTERED,
                    userEvent.getUserId(),
                    "USER",
                    Map.of("username", userEvent.getUsername(),
                           "email", userEvent.getEmail() != null ? userEvent.getEmail() : "")
            );
        } catch (Exception e) {
            log.error("Failed to process USER_REGISTERED event: {}", e.getMessage(), e);
        }
    }

    // profile got updated (usually by an admin) - let the user know
    @KafkaListener(topics = KafkaConfig.USER_UPDATED_TOPIC, groupId = "notification-service-group")
    public void handleUserUpdated(Map<String, Object> event) {
        UserEvent userEvent = UserEvent.fromMap(event);
        log.info("Received USER_UPDATED event: userId={}, username={}", userEvent.getUserId(), userEvent.getUsername());

        try {
            String title = "Profil Bilgileriniz Guncellendi";
            String message = String.format(
                    "Merhaba <strong>%s</strong>,<br><br>"
                    + "Profil bilgileriniz bir yonetici tarafindan onaylanarak guncellenmistir.<br>"
                    + "Guncel bilgilerinizi profilinizden kontrol edebilirsiniz.",
                    userEvent.getFullName() != null ? userEvent.getFullName() : userEvent.getUsername()
            );

            notificationService.createAndSend(
                    userEvent.getUserId(),
                    userEvent.getEmail(),
                    title,
                    message,
                    NotificationType.USER_UPDATED,
                    userEvent.getUserId(),
                    "USER",
                    Map.of("username", userEvent.getUsername())
            );
        } catch (Exception e) {
            log.error("Failed to process USER_UPDATED event: {}", e.getMessage(), e);
        }
    }
}
