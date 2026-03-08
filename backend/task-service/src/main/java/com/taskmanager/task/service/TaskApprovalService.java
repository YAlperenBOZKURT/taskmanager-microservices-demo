/**
 * Handles the approval workflow - admins review requests from regular users
 * and either approve or reject them. Approved requests get executed automatically.
 * @author Yusuf Alperen Bozkurt
 */
package com.taskmanager.task.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.taskmanager.task.dto.*;
import com.taskmanager.task.entity.*;
import com.taskmanager.task.exception.TaskException;
import com.taskmanager.task.repository.TaskApprovalRequestRepository;
import com.taskmanager.task.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TaskApprovalService {

    private final TaskApprovalRequestRepository approvalRequestRepository;
    private final TaskRepository taskRepository;
    private final TaskService taskService;
    private final TaskKafkaProducer kafkaProducer;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    public Page<TaskApprovalRequestDto> getPendingRequests(Pageable pageable) {
        return approvalRequestRepository.findByStatus(ApprovalStatus.PENDING, pageable)
                .map(TaskApprovalRequestDto::fromEntity);
    }

    public Page<TaskApprovalRequestDto> getMyRequests(UUID userId, Pageable pageable) {
        return approvalRequestRepository.findByRequesterId(userId, pageable)
                .map(TaskApprovalRequestDto::fromEntity);
    }

    public Page<TaskApprovalRequestDto> getAllRequests(Pageable pageable) {
        return approvalRequestRepository.findAll(pageable)
                .map(TaskApprovalRequestDto::fromEntity);
    }

    @Transactional
    public TaskApprovalRequestDto reviewRequest(UUID requestId, ApprovalReviewRequest review,
                                                 UUID reviewerId, String reviewerUsername) {
        TaskApprovalRequest request = approvalRequestRepository.findById(requestId)
                .orElseThrow(() -> new TaskException("Approval request not found", HttpStatus.NOT_FOUND));

        // don't let someone review the same request twice
        if (request.getStatus() != ApprovalStatus.PENDING) {
            throw new TaskException("This request has already been reviewed", HttpStatus.BAD_REQUEST);
        }

        request.setStatus(review.getStatus());
        request.setReviewedById(reviewerId);
        request.setReviewedByUsername(reviewerUsername);
        request.setReviewNote(review.getReviewNote());

        // if approved, actually execute the operation right away
        if (review.getStatus() == ApprovalStatus.APPROVED) {
            executeApprovedRequest(request, reviewerId);
        }

        request = approvalRequestRepository.save(request);
        log.info("Approval request reviewed: requestId={}, status={}, reviewer={}",
                requestId, review.getStatus(), reviewerUsername);

        kafkaProducer.sendApprovalReviewed(request);
        return TaskApprovalRequestDto.fromEntity(request);
    }

    // route to the right handler based on what kind of request was approved
    private void executeApprovedRequest(TaskApprovalRequest request, UUID approverId) {
        switch (request.getRequestType()) {
            case CREATE -> executeCreateTask(request, approverId);
            case UPDATE -> executeUpdateTask(request);
            case DELETE -> executeDeleteTask(request);
            case ASSIGN -> executeAssignTask(request);
        }
    }

    // deserialize the stored json back into a CreateTaskRequest and build the task
    private void executeCreateTask(TaskApprovalRequest request, UUID approverId) {
        try {
            CreateTaskRequest createRequest = objectMapper.readValue(request.getRequestData(), CreateTaskRequest.class);

            Task task = Task.builder()
                    .title(createRequest.getTitle())
                    .description(createRequest.getDescription())
                    .priority(createRequest.getPriority() != null ? createRequest.getPriority() : TaskPriority.MEDIUM)
                    .status(TaskStatus.APPROVED)
                    .creatorId(request.getRequesterId())
                    .approverId(approverId)
                    .teamLeaderId(createRequest.getTeamLeaderId())
                    .assigneeIds(createRequest.getAssigneeIds() != null ? createRequest.getAssigneeIds() : new HashSet<>())
                    .dueDate(createRequest.getDueDate())
                    .build();

            task = taskRepository.save(task);
            request.setTaskId(task.getId());

            log.info("Task created via approval: taskId={}, requestId={}", task.getId(), request.getId());
            kafkaProducer.sendTaskCreated(task);
        } catch (Exception e) {
            log.error("Failed to execute approved CREATE request: {}", e.getMessage());
            throw new TaskException("Failed to create task from approved request", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private void executeUpdateTask(TaskApprovalRequest request) {
        try {
            UpdateTaskRequest updateRequest = objectMapper.readValue(request.getRequestData(), UpdateTaskRequest.class);
            Task task = taskService.getTaskEntity(request.getTaskId());
            taskService.applyUpdates(task, updateRequest);
            task = taskRepository.save(task);

            log.info("Task updated via approval: taskId={}, requestId={}", task.getId(), request.getId());
            kafkaProducer.sendTaskUpdated(task);
        } catch (TaskException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to execute approved UPDATE request: {}", e.getMessage());
            throw new TaskException("Failed to update task from approved request", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // try to clean up attachments before deleting - if one fails, keep going
    private void executeDeleteTask(TaskApprovalRequest request) {
        Task task = taskService.getTaskEntity(request.getTaskId());

        for (Attachment attachment : task.getAttachments()) {
            try {
                taskService.deleteAttachment(attachment.getId(), request.getRequesterId(), true);
            } catch (Exception e) {
                log.warn("Failed to delete attachment {} during task deletion: {}", attachment.getId(), e.getMessage());
            }
        }

        taskRepository.delete(task);
        log.info("Task deleted via approval: taskId={}, requestId={}", request.getTaskId(), request.getId());
        kafkaProducer.sendTaskDeleted(task);
    }

    private void executeAssignTask(TaskApprovalRequest request) {
        try {
            AssignTaskRequest assignRequest = objectMapper.readValue(request.getRequestData(), AssignTaskRequest.class);
            Task task = taskService.getTaskEntity(request.getTaskId());
            task.setAssigneeIds(assignRequest.getAssigneeIds());
            task = taskRepository.save(task);

            log.info("Task assigned via approval: taskId={}, requestId={}", task.getId(), request.getId());
            kafkaProducer.sendTaskAssigned(task);
        } catch (TaskException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to execute approved ASSIGN request: {}", e.getMessage());
            throw new TaskException("Failed to assign task from approved request", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
