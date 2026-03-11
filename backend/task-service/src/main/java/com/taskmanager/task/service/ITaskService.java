package com.taskmanager.task.service;

import com.taskmanager.task.dto.*;
import com.taskmanager.task.entity.Task;
import com.taskmanager.task.entity.TaskStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Set;
import java.util.UUID;

public interface ITaskService {

    // Admin/Direct operations
    TaskDto createTaskDirect(CreateTaskRequest request, UUID userId, String username);

    TaskDto updateTaskDirect(UUID taskId, UpdateTaskRequest request, UUID userId, String username,
                             Set<String> userTeams, boolean isSuperAdmin);

    void deleteTaskDirect(UUID taskId, UUID userId, String username,
                          Set<String> userTeams, boolean isSuperAdmin);

    TaskDto assignTaskDirect(UUID taskId, AssignTaskRequest request, UUID userId, String username,
                             Set<String> userTeams, boolean isSuperAdmin);

    TaskDto markTaskPending(UUID taskId, UUID userId, String username,
                            Set<String> userTeams, boolean isSuperAdmin);

    TaskDto approveCompletion(UUID taskId, UUID userId, String username,
                              Set<String> userTeams, boolean isSuperAdmin);

    // User request-based operations
    TaskApprovalRequestDto requestCreateTask(CreateTaskRequest request, UUID userId, String username);

    TaskApprovalRequestDto requestUpdateTask(UUID taskId, UpdateTaskRequest request, UUID userId, String username);

    TaskApprovalRequestDto requestCompleteTask(UUID taskId, UUID userId, String username, String message);

    // Progress entries
    TaskProgressEntryDto addProgressEntry(UUID taskId, String message, UUID userId, String username,
                                          Set<String> userTeams, boolean isSuperAdmin);

    List<TaskProgressEntryDto> getProgressEntries(UUID taskId);

    // Read operations
    TaskDto getTaskById(UUID taskId, Set<String> userTeams, boolean isSuperAdmin);

    Page<TaskDto> getAllTasks(Set<String> userTeams, boolean isSuperAdmin, Pageable pageable);

    Page<TaskDto> getTasksByCreator(UUID creatorId, Pageable pageable);

    Page<TaskDto> getTasksByAssignee(UUID assigneeId, Pageable pageable);

    Page<TaskDto> getTasksByStatus(TaskStatus status, Set<String> userTeams,
                                   boolean isSuperAdmin, Pageable pageable);

    // Attachment operations
    AttachmentDto uploadAttachment(UUID taskId, MultipartFile file, UUID userId);

    List<AttachmentDto> getAttachments(UUID taskId);

    void deleteAttachment(UUID attachmentId, UUID userId, boolean isAdmin);

    // Helper
    Task getTaskEntity(UUID taskId);
}
