/**
 * Core task service - handles all task CRUD operations. Admins can do things
 * directly, regular users go through the approval flow.
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
import com.taskmanager.task.repository.TaskProgressEntryRepository;
import com.taskmanager.task.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final AttachmentRepository attachmentRepository;
    private final TaskApprovalRequestRepository approvalRequestRepository;
    private final TaskProgressEntryRepository progressEntryRepository;
    private final MinioService minioService;
    private final TaskKafkaProducer kafkaProducer;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    // ==================== ADMIN/SUPER_ADMIN: Direct Operations ====================

    @Transactional
    public TaskDto createTaskDirect(CreateTaskRequest request, UUID userId, String username) {
        validateDueDate(request.getDueDate());

        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .team(request.getTeam())
                .priority(request.getPriority() != null ? request.getPriority() : TaskPriority.MEDIUM)
                .status(TaskStatus.ACTIVE)
                .creatorId(userId)
                .assigneeIds(request.getAssigneeIds() != null ? request.getAssigneeIds() : new HashSet<>())
                .dueDate(request.getDueDate())
                .build();

        task = taskRepository.save(task);
        log.info("Task created directly by {}: taskId={}, team={}", username, task.getId(), task.getTeam());

        kafkaProducer.sendTaskCreated(task);
        return TaskDto.fromEntity(task);
    }

    @Transactional
    public TaskDto updateTaskDirect(UUID taskId, UpdateTaskRequest request, UUID userId, String username,
                                     Set<String> userTeams, boolean isSuperAdmin) {
        Task task = getTaskEntity(taskId);
        enforceTeamAccess(task, userTeams, isSuperAdmin);
        if (request.getDueDate() != null) {
            validateDueDate(request.getDueDate());
        }
        applyUpdates(task, request);
        task = taskRepository.save(task);

        log.info("Task updated directly by {}: taskId={}", username, taskId);
        kafkaProducer.sendTaskUpdated(task);
        return TaskDto.fromEntity(task);
    }

    @Transactional
    public void deleteTaskDirect(UUID taskId, UUID userId, String username,
                                  Set<String> userTeams, boolean isSuperAdmin) {
        Task task = getTaskEntity(taskId);
        enforceTeamAccess(task, userTeams, isSuperAdmin);

        for (Attachment attachment : task.getAttachments()) {
            minioService.deleteFile(attachment.getFilePath());
        }

        taskRepository.delete(task);
        log.info("Task deleted directly by {}: taskId={}", username, taskId);
        kafkaProducer.sendTaskDeleted(task);
    }

    @Transactional
    public TaskDto assignTaskDirect(UUID taskId, AssignTaskRequest request, UUID userId, String username,
                                     Set<String> userTeams, boolean isSuperAdmin) {
        Task task = getTaskEntity(taskId);
        enforceTeamAccess(task, userTeams, isSuperAdmin);
        task.setAssigneeIds(request.getAssigneeIds());
        task = taskRepository.save(task);

        log.info("Task assigned directly by {}: taskId={}, assignees={}", username, taskId, request.getAssigneeIds());
        kafkaProducer.sendTaskAssigned(task);
        return TaskDto.fromEntity(task);
    }

    @Transactional
    public TaskDto markTaskPending(UUID taskId, UUID userId, String username,
                                    Set<String> userTeams, boolean isSuperAdmin) {
        Task task = getTaskEntity(taskId);
        enforceTeamAccess(task, userTeams, isSuperAdmin);

        if (task.getStatus() != TaskStatus.ACTIVE) {
            throw new TaskException("Only ACTIVE tasks can be marked as pending", HttpStatus.BAD_REQUEST);
        }

        task.setStatus(TaskStatus.PENDING);
        task = taskRepository.save(task);
        log.info("Task marked as pending by {}: taskId={}", username, taskId);
        kafkaProducer.sendTaskUpdated(task);
        return TaskDto.fromEntity(task);
    }

    @Transactional
    public TaskDto approveCompletion(UUID taskId, UUID userId, String username,
                                      Set<String> userTeams, boolean isSuperAdmin) {
        Task task = getTaskEntity(taskId);
        enforceTeamAccess(task, userTeams, isSuperAdmin);

        if (task.getStatus() != TaskStatus.PENDING) {
            throw new TaskException("Only PENDING tasks can be approved", HttpStatus.BAD_REQUEST);
        }

        task.setStatus(TaskStatus.COMPLETED);
        task = taskRepository.save(task);
        log.info("Task completion approved by {}: taskId={}", username, taskId);
        kafkaProducer.sendTaskUpdated(task);
        return TaskDto.fromEntity(task);
    }

    // ==================== USER: Request-based Operations ====================

    @Transactional
    public TaskApprovalRequestDto requestCreateTask(CreateTaskRequest request, UUID userId, String username) {
        if (request.getDueDate() != null) {
            validateDueDate(request.getDueDate());
        }

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
        getTaskEntity(taskId);
        if (request.getDueDate() != null) {
            validateDueDate(request.getDueDate());
        }

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
    public TaskApprovalRequestDto requestCompleteTask(UUID taskId, UUID userId, String username, String message) {
        Task task = getTaskEntity(taskId);
        if (task.getStatus() != TaskStatus.ACTIVE) {
            throw new TaskException("Only ACTIVE tasks can have completion requests", HttpStatus.BAD_REQUEST);
        }

        Map<String, String> completionData = new HashMap<>();
        completionData.put("taskId", taskId.toString());
        if (message != null) {
            completionData.put("message", message);
        }

        TaskApprovalRequest approvalRequest = TaskApprovalRequest.builder()
                .requestType(RequestType.COMPLETION)
                .taskId(taskId)
                .requesterId(userId)
                .requesterUsername(username)
                .requestData(serializeToJson(completionData))
                .build();

        approvalRequest = approvalRequestRepository.save(approvalRequest);
        log.info("Task completion request submitted by {} for taskId={}: requestId={}", username, taskId, approvalRequest.getId());

        kafkaProducer.sendApprovalRequested(approvalRequest);
        return TaskApprovalRequestDto.fromEntity(approvalRequest);
    }

    // ==================== Progress Entry Operations ====================

    @Transactional
    public TaskProgressEntryDto addProgressEntry(UUID taskId, String message, UUID userId, String username,
                                                  Set<String> userTeams, boolean isSuperAdmin) {
        Task task = getTaskEntity(taskId);
        enforceTeamAccess(task, userTeams, isSuperAdmin);

        TaskProgressEntry entry = TaskProgressEntry.builder()
                .task(task)
                .message(message)
                .createdBy(userId)
                .createdByUsername(username)
                .build();

        entry = progressEntryRepository.save(entry);
        log.info("Progress entry added by {} for taskId={}: entryId={}", username, taskId, entry.getId());
        return TaskProgressEntryDto.fromEntity(entry);
    }

    public List<TaskProgressEntryDto> getProgressEntries(UUID taskId) {
        getTaskEntity(taskId);
        return progressEntryRepository.findByTaskIdOrderByCreatedAtAsc(taskId).stream()
                .map(TaskProgressEntryDto::fromEntity)
                .toList();
    }

    // ==================== Read Operations (Team-based visibility) ====================

    public TaskDto getTaskById(UUID taskId, Set<String> userTeams, boolean isSuperAdmin) {
        Task task = getTaskEntity(taskId);
        enforceTeamAccess(task, userTeams, isSuperAdmin);
        return TaskDto.fromEntity(task);
    }

    public Page<TaskDto> getAllTasks(Set<String> userTeams, boolean isSuperAdmin, Pageable pageable) {
        if (isSuperAdmin) {
            return taskRepository.findAll(pageable).map(TaskDto::fromEntity);
        }
        if (userTeams == null || userTeams.isEmpty()) {
            return Page.empty(pageable);
        }
        return taskRepository.findByTeamIn(userTeams, pageable).map(TaskDto::fromEntity);
    }

    public Page<TaskDto> getTasksByCreator(UUID creatorId, Pageable pageable) {
        return taskRepository.findByCreatorId(creatorId, pageable).map(TaskDto::fromEntity);
    }

    public Page<TaskDto> getTasksByAssignee(UUID assigneeId, Pageable pageable) {
        return taskRepository.findByAssigneeId(assigneeId, pageable).map(TaskDto::fromEntity);
    }

    public Page<TaskDto> getTasksByStatus(TaskStatus status, Set<String> userTeams,
                                           boolean isSuperAdmin, Pageable pageable) {
        if (isSuperAdmin) {
            return taskRepository.findByStatus(status, pageable).map(TaskDto::fromEntity);
        }
        if (userTeams == null || userTeams.isEmpty()) {
            return Page.empty(pageable);
        }
        return taskRepository.findByTeamInAndStatus(userTeams, status, pageable).map(TaskDto::fromEntity);
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
        getTaskEntity(taskId);
        return attachmentRepository.findByTaskId(taskId).stream()
                .map(AttachmentDto::fromEntity)
                .toList();
    }

    @Transactional
    public void deleteAttachment(UUID attachmentId, UUID userId, boolean isAdmin) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new TaskException("Attachment not found", HttpStatus.NOT_FOUND));

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

    void applyUpdates(Task task, UpdateTaskRequest request) {
        if (request.getTitle() != null) {
            task.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            task.setDescription(request.getDescription());
        }
        if (request.getTeam() != null) {
            task.setTeam(request.getTeam());
        }
        if (request.getPriority() != null) {
            task.setPriority(request.getPriority());
        }
        if (request.getAssigneeIds() != null) {
            task.setAssigneeIds(request.getAssigneeIds());
        }
        if (request.getDueDate() != null) {
            task.setDueDate(request.getDueDate());
        }
    }

    private void enforceTeamAccess(Task task, Set<String> userTeams, boolean isSuperAdmin) {
        if (isSuperAdmin) return;
        if (task.getTeam() == null) return;
        if (userTeams == null || !userTeams.contains(task.getTeam())) {
            throw new TaskException("You don't have access to this task's team", HttpStatus.FORBIDDEN);
        }
    }

    private void validateDueDate(LocalDateTime dueDate) {
        if (dueDate != null && dueDate.isBefore(LocalDateTime.now())) {
            throw new TaskException("Due date must not be in the past", HttpStatus.BAD_REQUEST);
        }
    }

    String serializeToJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            throw new TaskException("Failed to serialize request data", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
