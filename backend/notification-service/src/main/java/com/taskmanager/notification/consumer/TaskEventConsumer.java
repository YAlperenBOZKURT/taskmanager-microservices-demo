/**
 * Picks up task lifecycle events from kafka and notifies relevant users
 * (creator, assignees)
 * @author Yusuf Alperen Bozkurt
 */
package com.taskmanager.notification.consumer;

import com.taskmanager.notification.config.KafkaConfig;
import com.taskmanager.notification.document.NotificationType;
import com.taskmanager.notification.event.TaskEvent;
import com.taskmanager.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class TaskEventConsumer {

    private final NotificationService notificationService;

    @KafkaListener(topics = KafkaConfig.TASK_CREATED_TOPIC, groupId = "notification-service-group")
    public void handleTaskCreated(TaskEvent event) {
        log.info("Received TASK_CREATED event: taskId={}, title={}", event.getTaskId(), event.getTitle());

        try {
            notifyUser(
                    event.getCreatorId(),
                    "Yeni Gorev Olusturuldu",
                    String.format("Olusturdugumuz <strong>%s</strong> gorevi basariyla kaydedildi.<br>"
                            + "Durum: <strong>%s</strong> | Oncelik: <strong>%s</strong>",
                            event.getTitle(), event.getStatus(), event.getPriority()),
                    NotificationType.TASK_CREATED,
                    event.getTaskId().toString(),
                    event
            );

            if (event.getAssigneeIds() != null) {
                for (UUID assigneeId : event.getAssigneeIds()) {
                    if (!assigneeId.equals(event.getCreatorId())) {
                        notifyUser(
                                assigneeId,
                                "Size Yeni Bir Gorev Atandi",
                                String.format("<strong>%s</strong> gorevi size atanmistir.<br>"
                                        + "Oncelik: <strong>%s</strong>",
                                        event.getTitle(), event.getPriority()),
                                NotificationType.TASK_ASSIGNED,
                                event.getTaskId().toString(),
                                event
                        );
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to process TASK_CREATED event: {}", e.getMessage(), e);
        }
    }

    @KafkaListener(topics = KafkaConfig.TASK_UPDATED_TOPIC, groupId = "notification-service-group")
    public void handleTaskUpdated(TaskEvent event) {
        log.info("Received TASK_UPDATED event: taskId={}, title={}", event.getTaskId(), event.getTitle());

        try {
            if (event.getAssigneeIds() != null) {
                for (UUID assigneeId : event.getAssigneeIds()) {
                    notifyUser(
                            assigneeId,
                            "Gorev Guncellendi",
                            String.format("Atandiginiz <strong>%s</strong> gorevi guncellendi.<br>"
                                    + "Guncel Durum: <strong>%s</strong> | Oncelik: <strong>%s</strong>",
                                    event.getTitle(), event.getStatus(), event.getPriority()),
                            NotificationType.TASK_UPDATED,
                            event.getTaskId().toString(),
                            event
                    );
                }
            }
        } catch (Exception e) {
            log.error("Failed to process TASK_UPDATED event: {}", e.getMessage(), e);
        }
    }

    @KafkaListener(topics = KafkaConfig.TASK_DELETED_TOPIC, groupId = "notification-service-group")
    public void handleTaskDeleted(TaskEvent event) {
        log.info("Received TASK_DELETED event: taskId={}, title={}", event.getTaskId(), event.getTitle());

        try {
            if (event.getAssigneeIds() != null) {
                for (UUID assigneeId : event.getAssigneeIds()) {
                    notifyUser(
                            assigneeId,
                            "Gorev Silindi",
                            String.format("Atandiginiz <strong>%s</strong> gorevi silindi.", event.getTitle()),
                            NotificationType.TASK_DELETED,
                            event.getTaskId().toString(),
                            event
                    );
                }
            }
        } catch (Exception e) {
            log.error("Failed to process TASK_DELETED event: {}", e.getMessage(), e);
        }
    }

    @KafkaListener(topics = KafkaConfig.TASK_ASSIGNED_TOPIC, groupId = "notification-service-group")
    public void handleTaskAssigned(TaskEvent event) {
        log.info("Received TASK_ASSIGNED event: taskId={}, assignees={}", event.getTaskId(), event.getAssigneeIds());

        try {
            if (event.getAssigneeIds() != null) {
                for (UUID assigneeId : event.getAssigneeIds()) {
                    notifyUser(
                            assigneeId,
                            "Gorev Atamasi Yapildi",
                            String.format("<strong>%s</strong> gorevi size atanmistir.<br>"
                                    + "Oncelik: <strong>%s</strong> | Durum: <strong>%s</strong>",
                                    event.getTitle(), event.getPriority(), event.getStatus()),
                            NotificationType.TASK_ASSIGNED,
                            event.getTaskId().toString(),
                            event
                    );
                }
            }
        } catch (Exception e) {
            log.error("Failed to process TASK_ASSIGNED event: {}", e.getMessage(), e);
        }
    }

    private void notifyUser(UUID userId, String title, String message,
                            NotificationType type, String referenceId, TaskEvent event) {
        notificationService.createAndSend(
                userId.toString(),
                null,
                title,
                message,
                type,
                referenceId,
                "TASK",
                Map.of(
                        "taskId", event.getTaskId().toString(),
                        "title", event.getTitle(),
                        "status", event.getStatus(),
                        "priority", event.getPriority()
                )
        );
    }
}
