/**
 * Handles approval workflow events - notifies admins about new requests
 * and users about approval/rejection decisions
 */
package com.taskmanager.notification.consumer;

import com.taskmanager.notification.config.KafkaConfig;
import com.taskmanager.notification.document.NotificationType;
import com.taskmanager.notification.event.TaskApprovalEvent;
import com.taskmanager.notification.service.INotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class TaskApprovalEventConsumer {

    private final INotificationService notificationService;

    // someone submitted a task for approval - let the admins know
    @KafkaListener(topics = KafkaConfig.TASK_APPROVAL_REQUESTED_TOPIC, groupId = "notification-service-group")
    public void handleApprovalRequested(TaskApprovalEvent event) {
        log.info("Received TASK_APPROVAL_REQUESTED event: requestId={}, type={}, requester={}",
                event.getApprovalRequestId(), event.getRequestType(), event.getRequesterUsername());

        try {
            String requestTypeLabel = translateRequestType(event.getRequestType());

            // broadcast to admins - using a special "ADMIN_BROADCAST" recipient
            // TODO: ideally we'd fetch actual admin IDs from auth-service
            String title = "Yeni Onay Talebi";
            String message = String.format(
                    "<strong>%s</strong> kullanicisi bir <strong>%s</strong> talebi olusturdu.<br>"
                    + "Talep No: <strong>%s</strong><br>"
                    + "%s"
                    + "Lutfen onay panelinden bu talebi inceleyiniz.",
                    event.getRequesterUsername(),
                    requestTypeLabel,
                    event.getApprovalRequestId(),
                    event.getTaskId() != null
                            ? String.format("Gorev ID: <strong>%s</strong><br>", event.getTaskId())
                            : ""
            );

            Map<String, Object> metadata = new HashMap<>();
            metadata.put("approvalRequestId", event.getApprovalRequestId().toString());
            metadata.put("requestType", event.getRequestType());
            metadata.put("requesterUsername", event.getRequesterUsername());
            if (event.getTaskId() != null) {
                metadata.put("taskId", event.getTaskId().toString());
            }

            notificationService.createAndSend(
                    "ADMIN_BROADCAST",
                    null,
                    title,
                    message,
                    NotificationType.TASK_APPROVAL_REQUESTED,
                    event.getApprovalRequestId().toString(),
                    "APPROVAL_REQUEST",
                    metadata
            );
        } catch (Exception e) {
            log.error("Failed to process TASK_APPROVAL_REQUESTED event: {}", e.getMessage(), e);
        }
    }

    // admin approved or rejected - notify the requester
    @KafkaListener(topics = KafkaConfig.TASK_APPROVAL_REVIEWED_TOPIC, groupId = "notification-service-group")
    public void handleApprovalReviewed(TaskApprovalEvent event) {
        log.info("Received TASK_APPROVAL_REVIEWED event: requestId={}, status={}, reviewer={}",
                event.getApprovalRequestId(), event.getApprovalStatus(), event.getReviewedByUsername());

        try {
            String requestTypeLabel = translateRequestType(event.getRequestType());
            boolean approved = "APPROVED".equals(event.getApprovalStatus());

            String title = approved ? "Talebiniz Onaylandi" : "Talebiniz Reddedildi";
            String message = String.format(
                    "Merhaba <strong>%s</strong>,<br><br>"
                    + "<strong>%s</strong> talebiniz <strong>%s</strong> tarafindan <strong>%s</strong>.<br>"
                    + "Talep No: <strong>%s</strong><br>"
                    + "%s",
                    event.getRequesterUsername(),
                    requestTypeLabel,
                    event.getReviewedByUsername(),
                    approved ? "onaylandi" : "reddedildi",
                    event.getApprovalRequestId(),
                    event.getTaskId() != null
                            ? String.format("Gorev ID: <strong>%s</strong>", event.getTaskId())
                            : ""
            );

            Map<String, Object> metadata = new HashMap<>();
            metadata.put("approvalRequestId", event.getApprovalRequestId().toString());
            metadata.put("requestType", event.getRequestType());
            metadata.put("approvalStatus", event.getApprovalStatus());
            metadata.put("reviewedByUsername", event.getReviewedByUsername());
            if (event.getTaskId() != null) {
                metadata.put("taskId", event.getTaskId().toString());
            }

            notificationService.createAndSend(
                    event.getRequesterId().toString(),
                    null,
                    title,
                    message,
                    NotificationType.TASK_APPROVAL_REVIEWED,
                    event.getApprovalRequestId().toString(),
                    "APPROVAL_REQUEST",
                    metadata
            );
        } catch (Exception e) {
            log.error("Failed to process TASK_APPROVAL_REVIEWED event: {}", e.getMessage(), e);
        }
    }

    // translate the request type enum to turkish for the notification messages
    private String translateRequestType(String requestType) {
        return switch (requestType) {
            case "CREATE" -> "Gorev Olusturma";
            case "UPDATE" -> "Gorev Guncelleme";
            case "COMPLETION" -> "Gorev Tamamlama";
            default -> requestType;
        };
    }
}
