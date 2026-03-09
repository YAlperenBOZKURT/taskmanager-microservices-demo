/**
 * REST controller for all task operations - routes requests based on
 * user role (admin vs regular user) to either direct ops or approval flow.
 * @author Yusuf Alperen Bozkurt
 */
package com.taskmanager.task.controller;

import com.taskmanager.task.dto.*;
import com.taskmanager.task.entity.TaskStatus;
import com.taskmanager.task.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    // ==================== Create ====================

    @PostMapping
    public ResponseEntity<?> createTask(@Valid @RequestBody CreateTaskRequest request,
                                        Authentication auth) {
        UUID userId = getUserId(auth);
        String username = auth.getName();

        if (isAdmin(auth)) {
            TaskDto task = taskService.createTaskDirect(request, userId, username);
            return ResponseEntity.status(HttpStatus.CREATED).body(task);
        } else {
            TaskApprovalRequestDto approvalRequest = taskService.requestCreateTask(request, userId, username);
            return ResponseEntity.status(HttpStatus.ACCEPTED).body(approvalRequest);
        }
    }

    // ==================== Update ====================

    @PutMapping("/{taskId}")
    public ResponseEntity<?> updateTask(@PathVariable UUID taskId,
                                        @Valid @RequestBody UpdateTaskRequest request,
                                        Authentication auth) {
        UUID userId = getUserId(auth);
        String username = auth.getName();

        if (isAdmin(auth)) {
            TaskDto task = taskService.updateTaskDirect(taskId, request, userId, username,
                    getUserTeams(auth), isSuperAdmin(auth));
            return ResponseEntity.ok(task);
        } else {
            TaskApprovalRequestDto approvalRequest = taskService.requestUpdateTask(taskId, request, userId, username);
            return ResponseEntity.status(HttpStatus.ACCEPTED).body(approvalRequest);
        }
    }

    // ==================== Delete (Admin/SuperAdmin only) ====================

    @DeleteMapping("/{taskId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Void> deleteTask(@PathVariable UUID taskId, Authentication auth) {
        UUID userId = getUserId(auth);
        String username = auth.getName();
        taskService.deleteTaskDirect(taskId, userId, username, getUserTeams(auth), isSuperAdmin(auth));
        return ResponseEntity.noContent().build();
    }

    // ==================== Assign (Admin/SuperAdmin only) ====================

    @PostMapping("/{taskId}/assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<TaskDto> assignTask(@PathVariable UUID taskId,
                                               @Valid @RequestBody AssignTaskRequest request,
                                               Authentication auth) {
        UUID userId = getUserId(auth);
        String username = auth.getName();
        TaskDto task = taskService.assignTaskDirect(taskId, request, userId, username,
                getUserTeams(auth), isSuperAdmin(auth));
        return ResponseEntity.ok(task);
    }

    // ==================== Status Transitions ====================

    @PostMapping("/{taskId}/mark-pending")
    public ResponseEntity<TaskDto> markTaskPending(@PathVariable UUID taskId, Authentication auth) {
        UUID userId = getUserId(auth);
        String username = auth.getName();
        TaskDto task = taskService.markTaskPending(taskId, userId, username,
                getUserTeams(auth), isSuperAdmin(auth));
        return ResponseEntity.ok(task);
    }

    @PostMapping("/{taskId}/approve-completion")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<TaskDto> approveCompletion(@PathVariable UUID taskId, Authentication auth) {
        UUID userId = getUserId(auth);
        String username = auth.getName();
        TaskDto task = taskService.approveCompletion(taskId, userId, username,
                getUserTeams(auth), isSuperAdmin(auth));
        return ResponseEntity.ok(task);
    }

    @PostMapping("/{taskId}/complete")
    public ResponseEntity<?> completeTask(@PathVariable UUID taskId,
                                          @RequestBody(required = false) Map<String, String> body,
                                          Authentication auth) {
        UUID userId = getUserId(auth);
        String username = auth.getName();

        if (isAdmin(auth)) {
            TaskDto task = taskService.markTaskPending(taskId, userId, username,
                    getUserTeams(auth), isSuperAdmin(auth));
            return ResponseEntity.ok(task);
        } else {
            String message = body != null ? body.get("message") : null;
            TaskApprovalRequestDto approvalRequest = taskService.requestCompleteTask(
                    taskId, userId, username, message);
            return ResponseEntity.status(HttpStatus.ACCEPTED).body(approvalRequest);
        }
    }

    // ==================== Progress Entries ====================

    @PostMapping("/{taskId}/progress")
    public ResponseEntity<TaskProgressEntryDto> addProgressEntry(
            @PathVariable UUID taskId,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        UUID userId = getUserId(auth);
        String username = auth.getName();
        String message = body.get("message");
        if (message == null || message.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        TaskProgressEntryDto entry = taskService.addProgressEntry(
                taskId, message, userId, username, getUserTeams(auth), isSuperAdmin(auth));
        return ResponseEntity.status(HttpStatus.CREATED).body(entry);
    }

    @GetMapping("/{taskId}/progress")
    public ResponseEntity<List<TaskProgressEntryDto>> getProgressEntries(@PathVariable UUID taskId) {
        return ResponseEntity.ok(taskService.getProgressEntries(taskId));
    }

    // ==================== Read ====================

    @GetMapping("/{taskId}")
    public ResponseEntity<TaskDto> getTask(@PathVariable UUID taskId, Authentication auth) {
        TaskDto task = taskService.getTaskById(taskId, getUserTeams(auth), isSuperAdmin(auth));
        return ResponseEntity.ok(task);
    }

    @GetMapping
    public ResponseEntity<Page<TaskDto>> getAllTasks(Authentication auth,
                                                     @PageableDefault(size = 20) Pageable pageable) {
        Page<TaskDto> tasks = taskService.getAllTasks(getUserTeams(auth), isSuperAdmin(auth), pageable);
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/my-tasks")
    public ResponseEntity<Page<TaskDto>> getMyTasks(Authentication auth,
                                                     @PageableDefault(size = 20) Pageable pageable) {
        UUID userId = getUserId(auth);
        return ResponseEntity.ok(taskService.getTasksByCreator(userId, pageable));
    }

    @GetMapping("/assigned-to-me")
    public ResponseEntity<Page<TaskDto>> getAssignedToMe(Authentication auth,
                                                          @PageableDefault(size = 20) Pageable pageable) {
        UUID userId = getUserId(auth);
        return ResponseEntity.ok(taskService.getTasksByAssignee(userId, pageable));
    }

    @GetMapping("/by-status/{status}")
    public ResponseEntity<Page<TaskDto>> getByStatus(@PathVariable TaskStatus status,
                                                      Authentication auth,
                                                      @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(taskService.getTasksByStatus(status, getUserTeams(auth), isSuperAdmin(auth), pageable));
    }

    // ==================== Attachments ====================

    @PostMapping("/{taskId}/attachments")
    public ResponseEntity<AttachmentDto> uploadAttachment(@PathVariable UUID taskId,
                                                           @RequestParam("file") MultipartFile file,
                                                           Authentication auth) {
        UUID userId = getUserId(auth);
        AttachmentDto attachment = taskService.uploadAttachment(taskId, file, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(attachment);
    }

    @GetMapping("/{taskId}/attachments")
    public ResponseEntity<List<AttachmentDto>> getAttachments(@PathVariable UUID taskId) {
        return ResponseEntity.ok(taskService.getAttachments(taskId));
    }

    @DeleteMapping("/attachments/{attachmentId}")
    public ResponseEntity<Void> deleteAttachment(@PathVariable UUID attachmentId,
                                                  Authentication auth) {
        UUID userId = getUserId(auth);
        taskService.deleteAttachment(attachmentId, userId, isAdmin(auth));
        return ResponseEntity.noContent().build();
    }

    // ==================== Helpers ====================

    private UUID getUserId(Authentication auth) {
        return UUID.fromString((String) auth.getCredentials());
    }

    @SuppressWarnings("unchecked")
    private Set<String> getUserTeams(Authentication auth) {
        if (auth.getDetails() instanceof Map) {
            Object teams = ((Map<String, Object>) auth.getDetails()).get("teams");
            if (teams instanceof Set) {
                return (Set<String>) teams;
            }
        }
        return Collections.emptySet();
    }

    private boolean isAdmin(Authentication auth) {
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> role.equals("ROLE_ADMIN") || role.equals("ROLE_SUPER_ADMIN"));
    }

    private boolean isSuperAdmin(Authentication auth) {
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> role.equals("ROLE_SUPER_ADMIN"));
    }
}
