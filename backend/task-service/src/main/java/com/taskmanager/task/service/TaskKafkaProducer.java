/**
 * Publishes task-related events to Kafka topics so other services
 * (like notifications) can react to changes.
 */
package com.taskmanager.task.service;

import com.taskmanager.task.config.KafkaConfig;
import com.taskmanager.task.entity.Task;
import com.taskmanager.task.entity.TaskApprovalRequest;
import com.taskmanager.task.event.TaskApprovalEvent;
import com.taskmanager.task.event.TaskEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class TaskKafkaProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    // using task id as the kafka key so events for the same task go to the same partition
    public void sendTaskCreated(Task task) {
        TaskEvent event = buildTaskEvent(task, "CREATED");
        kafkaTemplate.send(KafkaConfig.TASK_CREATED_TOPIC, task.getId().toString(), event);
        log.info("Kafka event sent: TASK_CREATED for taskId={}", task.getId());
    }

    public void sendTaskUpdated(Task task) {
        TaskEvent event = buildTaskEvent(task, "UPDATED");
        kafkaTemplate.send(KafkaConfig.TASK_UPDATED_TOPIC, task.getId().toString(), event);
        log.info("Kafka event sent: TASK_UPDATED for taskId={}", task.getId());
    }

    public void sendTaskDeleted(Task task) {
        TaskEvent event = buildTaskEvent(task, "DELETED");
        kafkaTemplate.send(KafkaConfig.TASK_DELETED_TOPIC, task.getId().toString(), event);
        log.info("Kafka event sent: TASK_DELETED for taskId={}", task.getId());
    }

    public void sendTaskAssigned(Task task) {
        TaskEvent event = buildTaskEvent(task, "ASSIGNED");
        kafkaTemplate.send(KafkaConfig.TASK_ASSIGNED_TOPIC, task.getId().toString(), event);
        log.info("Kafka event sent: TASK_ASSIGNED for taskId={}", task.getId());
    }

    public void sendApprovalRequested(TaskApprovalRequest request) {
        TaskApprovalEvent event = buildApprovalEvent(request);
        kafkaTemplate.send(KafkaConfig.TASK_APPROVAL_REQUESTED_TOPIC, request.getId().toString(), event);
        log.info("Kafka event sent: APPROVAL_REQUESTED for requestId={}", request.getId());
    }

    public void sendApprovalReviewed(TaskApprovalRequest request) {
        TaskApprovalEvent event = buildApprovalEvent(request);
        kafkaTemplate.send(KafkaConfig.TASK_APPROVAL_REVIEWED_TOPIC, request.getId().toString(), event);
        log.info("Kafka event sent: APPROVAL_REVIEWED for requestId={}, status={}",
                request.getId(), request.getStatus());
    }

    // build a snapshot of the task state at this moment for the event
    private TaskEvent buildTaskEvent(Task task, String eventType) {
        return TaskEvent.builder()
                .taskId(task.getId())
                .title(task.getTitle())
                .eventType(eventType)
                .team(task.getTeam())
                .creatorId(task.getCreatorId())
                .assigneeIds(task.getAssigneeIds())
                .status(task.getStatus().name())
                .priority(task.getPriority().name())
                .timestamp(LocalDateTime.now())
                .build();
    }

    private TaskApprovalEvent buildApprovalEvent(TaskApprovalRequest request) {
        return TaskApprovalEvent.builder()
                .approvalRequestId(request.getId())
                .taskId(request.getTaskId())
                .requestType(request.getRequestType().name())
                .requesterId(request.getRequesterId())
                .requesterUsername(request.getRequesterUsername())
                .approvalStatus(request.getStatus().name())
                .reviewedById(request.getReviewedById())
                .reviewedByUsername(request.getReviewedByUsername())
                .timestamp(LocalDateTime.now())
                .build();
    }
}
