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
import java.util.Set;
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

    public Page<TaskApprovalRequestDto> getPendingRequests(Set<String> reviewerTeams,
                                                            boolean isSuperAdmin, Pageable pageable) {
        Page<TaskApprovalRequest> requests = approvalRequestRepository
                .findByStatus(ApprovalStatus.PENDING, pageable);

        if (isSuperAdmin) {
            return requests.map(TaskApprovalRequestDto::fromEntity);
        }

        return requests.map(TaskApprovalRequestDto::fromEntity);
    }

    public Page<TaskApprovalRequestDto> getMyRequests(UUID userId, Pageable pageable) {
        return approvalRequestRepository.findByRequesterId(userId, pageable)
                .map(TaskApprovalRequestDto::fromEntity);
    }

    public Page<TaskApprovalRequestDto> getAllRequests(Set<String> reviewerTeams,
                                                       boolean isSuperAdmin, Pageable pageable) {
        if (isSuperAdmin) {
            return approvalRequestRepository.findAll(pageable)
                    .map(TaskApprovalRequestDto::fromEntity);
        }
        return approvalRequestRepository.findAll(pageable)
                .map(TaskApprovalRequestDto::fromEntity);
    }

    @Transactional
    public TaskApprovalRequestDto reviewRequest(UUID requestId, ApprovalReviewRequest review,
                                                 UUID reviewerId, String reviewerUsername) {
        TaskApprovalRequest request = approvalRequestRepository.findById(requestId)
                .orElseThrow(() -> new TaskException("Approval request not found", HttpStatus.NOT_FOUND));

        if (request.getStatus() != ApprovalStatus.PENDING) {
            throw new TaskException("This request has already been reviewed", HttpStatus.BAD_REQUEST);
        }

        request.setStatus(review.getStatus());
        request.setReviewedById(reviewerId);
        request.setReviewedByUsername(reviewerUsername);
        request.setReviewNote(review.getReviewNote());

        if (review.getStatus() == ApprovalStatus.APPROVED) {
            executeApprovedRequest(request, reviewerId);
        }

        request = approvalRequestRepository.save(request);
        log.info("Approval request reviewed: requestId={}, status={}, reviewer={}",
                requestId, review.getStatus(), reviewerUsername);

        kafkaProducer.sendApprovalReviewed(request);
        return TaskApprovalRequestDto.fromEntity(request);
    }

    private void executeApprovedRequest(TaskApprovalRequest request, UUID reviewerId) {
        switch (request.getRequestType()) {
            case CREATE -> executeCreateTask(request);
            case UPDATE -> executeUpdateTask(request);
            case COMPLETION -> executeCompleteTask(request);
        }
    }

    private void executeCreateTask(TaskApprovalRequest request) {
        try {
            CreateTaskRequest createRequest = objectMapper.readValue(request.getRequestData(), CreateTaskRequest.class);

            Task task = Task.builder()
                    .title(createRequest.getTitle())
                    .description(createRequest.getDescription())
                    .team(createRequest.getTeam())
                    .priority(createRequest.getPriority() != null ? createRequest.getPriority() : TaskPriority.MEDIUM)
                    .status(TaskStatus.ACTIVE)
                    .creatorId(request.getRequesterId())
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

    private void executeCompleteTask(TaskApprovalRequest request) {
        Task task = taskService.getTaskEntity(request.getTaskId());

        if (task.getStatus() != TaskStatus.ACTIVE && task.getStatus() != TaskStatus.PENDING) {
            throw new TaskException("Only ACTIVE or PENDING tasks can be completed", HttpStatus.BAD_REQUEST);
        }

        task.setStatus(TaskStatus.COMPLETED);
        task = taskRepository.save(task);

        log.info("Task completed via approval: taskId={}, requestId={}", task.getId(), request.getId());
        kafkaProducer.sendTaskUpdated(task);
    }
}
