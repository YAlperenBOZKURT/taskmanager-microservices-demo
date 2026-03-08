/**
 * Core task service - handles all task CRUD operations. Admins can do things
 * directly, regular users go through the approval flow.
 * @author Yusuf Alperen Bozkurt
 */
package com.taskmanager.task.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.taskmanager.task.dto.*;
import com.taskmanager.task.entity.*;
import com.taskmanager.task.exception.TaskException;
import com.taskmanager.task.repository.AttachmentRepository;
import com.taskmanager.task.repository.TaskApprovalRequestRepository;
import com.taskmanager.task.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final AttachmentRepository attachmentRepository;
    private final TaskApprovalRequestRepository approvalRequestRepository;
    private final MinioService minioService;
    private final TaskKafkaProducer kafkaProducer;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    // ==================== ADMIN: Direct Operations ====================

    // admins can create tasks directly without needing approval
    @Transactional
    public TaskDto createTaskDirect(CreateTaskRequest request, UUID userId, String username) {
        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .priority(request.getPriority() != null ? request.getPriority() : TaskPriority.MEDIUM)
                .status(TaskStatus.APPROVED)
                .creatorId(userId)
                .approverId(userId)
                .teamLeaderId(request.getTeamLeaderId())
                .assigneeIds(request.getAssigneeIds() != null ? request.getAssigneeIds() : new HashSet<>())
                .dueDate(request.getDueDate())
                .build();

        task = taskRepository.save(task);
        log.info("Task created directly by admin {}: taskId={}", username, task.getId());

        kafkaProducer.sendTaskCreated(task);
        return TaskDto.fromEntity(task);
    }

    @Transactional
    public TaskDto updateTaskDirect(UUID taskId, UpdateTaskRequest request, UUID userId, String username) {
        Task task = getTaskEntity(taskId);
        applyUpdates(task, request);
        task = taskRepository.save(task);

        log.info("Task updated directly by admin {}: taskId={}", username, taskId);
        kafkaProducer.sendTaskUpdated(task);
        return TaskDto.fromEntity(task);
    }

    @Transactional
    public void deleteTaskDirect(UUID taskId, UUID userId, String username) {
        Task task = getTaskEntity(taskId);

        // clean up attachments from minio before deleting the task
        for (Attachment attachment : task.getAttachments()) {
            minioService.deleteFile(attachment.getFilePath());
        }

        taskRepository.delete(task);
        log.info("Task deleted directly by admin {}: taskId={}", username, taskId);
        kafkaProducer.sendTaskDeleted(task);
    }

    @Transactional
    public TaskDto assignTaskDirect(UUID taskId, AssignTaskRequest request, UUID userId, String username) {
        Task task = getTaskEntity(taskId);
        task.setAssigneeIds(request.getAssigneeIds());
        task = taskRepository.save(task);

        log.info("Task assigned directly by admin {}: taskId={}, assignees={}", username, taskId, request.getAssigneeIds());
        kafkaProducer.sendTaskAssigned(task);
        return TaskDto.fromEntity(task);
    }

    // ==================== USER: Request-based Operations ====================

    // regular users need admin approval - serialize the request and store it
    @Transactional
    public TaskApprovalRequestDto requestCreateTask(CreateTaskRequest request, UUID userId, String username) {
        TaskApprovalRequest approvalRequest = TaskApprovalRequest.builder()
                .requestType(RequestType.CREATE)
                .requesterId(userId)
                .requesterUsername(username)
                .requestData(serializeToJson(request))
                .build();

        approvalRequest = approvalRequestRepository.save(approvalRequest);
        log.info("Task creation request submitted by {}: requestId={}", username, approvalRequest.getId());

        kafkaProducer.sendApprovalRequested(approvalRequest);
        return TaskApprovalRequestDto.fromEntity(approvalRequest);
    }

    @Transactional
    public TaskApprovalRequestDto requestUpdateTask(UUID taskId, UpdateTaskRequest request, UUID userId, String username) {
        getTaskEntity(taskId); // verify task exists

        TaskApprovalRequest approvalRequest = TaskApprovalRequest.builder()
                .requestType(RequestType.UPDATE)
                .taskId(taskId)
                .requesterId(userId)
                .requesterUsername(username)
                .requestData(serializeToJson(request))
                .build();

        approvalRequest = approvalRequestRepository.save(approvalRequest);
        log.info("Task update request submitted by {} for taskId={}: requestId={}", username, taskId, approvalRequest.getId());

        kafkaProducer.sendApprovalRequested(approvalRequest);
        return TaskApprovalRequestDto.fromEntity(approvalRequest);
    }

    @Transactional
    public TaskApprovalRequestDto requestDeleteTask(UUID taskId, UUID userId, String username) {
        getTaskEntity(taskId); // verify task exists

        TaskApprovalRequest approvalRequest = TaskApprovalRequest.builder()
                .requestType(RequestType.DELETE)
                .taskId(taskId)
                .requesterId(userId)
                .requesterUsername(username)
                .requestData("{}")
                .build();

        approvalRequest = approvalRequestRepository.save(approvalRequest);
        log.info("Task deletion request submitted by {} for taskId={}: requestId={}", username, taskId, approvalRequest.getId());

        kafkaProducer.sendApprovalRequested(approvalRequest);
        return TaskApprovalRequestDto.fromEntity(approvalRequest);
    }

    @Transactional
    public TaskApprovalRequestDto requestAssignTask(UUID taskId, AssignTaskRequest request, UUID userId, String username) {
        getTaskEntity(taskId); // verify task exists

        TaskApprovalRequest approvalRequest = TaskApprovalRequest.builder()
                .requestType(RequestType.ASSIGN)
                .taskId(taskId)
                .requesterId(userId)
                .requesterUsername(username)
                .requestData(serializeToJson(request))
                .build();

        approvalRequest = approvalRequestRepository.save(approvalRequest);
        log.info("Task assign request submitted by {} for taskId={}: requestId={}", username, taskId, approvalRequest.getId());

        kafkaProducer.sendApprovalRequested(approvalRequest);
        return TaskApprovalRequestDto.fromEntity(approvalRequest);
    }

    // ==================== Read Operations ====================

    public TaskDto getTaskById(UUID taskId) {
        return TaskDto.fromEntity(getTaskEntity(taskId));
    }

    public Page<TaskDto> getAllTasks(Pageable pageable) {
        return taskRepository.findAll(pageable).map(TaskDto::fromEntity);
    }

    public Page<TaskDto> getTasksByCreator(UUID creatorId, Pageable pageable) {
        return taskRepository.findByCreatorId(creatorId, pageable).map(TaskDto::fromEntity);
    }

    public Page<TaskDto> getTasksByAssignee(UUID assigneeId, Pageable pageable) {
        return taskRepository.findByAssigneeId(assigneeId, pageable).map(TaskDto::fromEntity);
    }

    public Page<TaskDto> getTasksByTeamLeader(UUID teamLeaderId, Pageable pageable) {
        return taskRepository.findByTeamLeaderId(teamLeaderId, pageable).map(TaskDto::fromEntity);
    }

    public Page<TaskDto> getTasksByStatus(TaskStatus status, Pageable pageable) {
        return taskRepository.findByStatus(status, pageable).map(TaskDto::fromEntity);
    }

    // ==================== Attachment Operations ====================

    @Transactional
    public AttachmentDto uploadAttachment(UUID taskId, MultipartFile file, UUID userId) {
        Task task = getTaskEntity(taskId);
        String filePath = minioService.uploadFile(taskId, file);

        Attachment attachment = Attachment.builder()
                .fileName(file.getOriginalFilename())
                .filePath(filePath)
                .fileSize(file.getSize())
                .contentType(file.getContentType())
                .uploadedBy(userId)
                .task(task)
                .build();

        attachment = attachmentRepository.save(attachment);
        log.info("Attachment uploaded: attachmentId={}, taskId={}, fileName={}", attachment.getId(), taskId, file.getOriginalFilename());
        return AttachmentDto.fromEntity(attachment);
    }

    public List<AttachmentDto> getAttachments(UUID taskId) {
        getTaskEntity(taskId); // verify task exists
        return attachmentRepository.findByTaskId(taskId).stream()
                .map(AttachmentDto::fromEntity)
                .toList();
    }

    @Transactional
    public void deleteAttachment(UUID attachmentId, UUID userId, boolean isAdmin) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new TaskException("Attachment not found", HttpStatus.NOT_FOUND));

        // check if user owns this attachment before deleting (admins can delete anything)
        if (!isAdmin && !attachment.getUploadedBy().equals(userId)) {
            throw new TaskException("You can only delete your own attachments", HttpStatus.FORBIDDEN);
        }

        minioService.deleteFile(attachment.getFilePath());
        attachmentRepository.delete(attachment);
        log.info("Attachment deleted: attachmentId={}", attachmentId);
    }

    // ==================== Helper Methods ====================

    public Task getTaskEntity(UUID taskId) {
        return taskRepository.findById(taskId)
                .orElseThrow(() -> new TaskException("Task not found with id: " + taskId, HttpStatus.NOT_FOUND));
    }

    // only update fields that were actually sent in the request (partial update)
    void applyUpdates(Task task, UpdateTaskRequest request) {
        if (request.getTitle() != null) {
            task.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            task.setDescription(request.getDescription());
        }
        if (request.getStatus() != null) {
            task.setStatus(request.getStatus());
        }
        if (request.getPriority() != null) {
            task.setPriority(request.getPriority());
        }
        if (request.getTeamLeaderId() != null) {
            task.setTeamLeaderId(request.getTeamLeaderId());
        }
        if (request.getAssigneeIds() != null) {
            task.setAssigneeIds(request.getAssigneeIds());
        }
        if (request.getDueDate() != null) {
            task.setDueDate(request.getDueDate());
        }
    }

    // serialize the request to json so we can store it for approval
    private String serializeToJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            throw new TaskException("Failed to serialize request data", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
