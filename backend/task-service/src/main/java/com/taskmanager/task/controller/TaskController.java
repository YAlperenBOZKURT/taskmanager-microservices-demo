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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

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

        // admins get instant task creation, regular users get a pending approval request
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
            TaskDto task = taskService.updateTaskDirect(taskId, request, userId, username);
            return ResponseEntity.ok(task);
        } else {
            TaskApprovalRequestDto approvalRequest = taskService.requestUpdateTask(taskId, request, userId, username);
            return ResponseEntity.status(HttpStatus.ACCEPTED).body(approvalRequest);
        }
    }

    // ==================== Delete ====================

    @DeleteMapping("/{taskId}")
    public ResponseEntity<?> deleteTask(@PathVariable UUID taskId, Authentication auth) {
        UUID userId = getUserId(auth);
        String username = auth.getName();

        if (isAdmin(auth)) {
            taskService.deleteTaskDirect(taskId, userId, username);
            return ResponseEntity.noContent().build();
        } else {
            TaskApprovalRequestDto approvalRequest = taskService.requestDeleteTask(taskId, userId, username);
            return ResponseEntity.status(HttpStatus.ACCEPTED).body(approvalRequest);
        }
    }

    // ==================== Assign ====================

    @PostMapping("/{taskId}/assign")
    public ResponseEntity<?> assignTask(@PathVariable UUID taskId,
                                        @Valid @RequestBody AssignTaskRequest request,
                                        Authentication auth) {
        UUID userId = getUserId(auth);
        String username = auth.getName();

        if (isAdmin(auth)) {
            TaskDto task = taskService.assignTaskDirect(taskId, request, userId, username);
            return ResponseEntity.ok(task);
        } else {
            TaskApprovalRequestDto approvalRequest = taskService.requestAssignTask(taskId, request, userId, username);
            return ResponseEntity.status(HttpStatus.ACCEPTED).body(approvalRequest);
        }
    }

    // ==================== Read ====================

    @GetMapping("/{taskId}")
    public ResponseEntity<TaskDto> getTask(@PathVariable UUID taskId) {
        return ResponseEntity.ok(taskService.getTaskById(taskId));
    }

    @GetMapping
    public ResponseEntity<Page<TaskDto>> getAllTasks(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(taskService.getAllTasks(pageable));
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
                                                      @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(taskService.getTasksByStatus(status, pageable));
    }

    @GetMapping("/by-team-leader/{teamLeaderId}")
    public ResponseEntity<Page<TaskDto>> getByTeamLeader(@PathVariable UUID teamLeaderId,
                                                          @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(taskService.getTasksByTeamLeader(teamLeaderId, pageable));
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

    // userId is stored in the credentials field by our gateway auth filter
    private UUID getUserId(Authentication auth) {
        return UUID.fromString((String) auth.getCredentials());
    }

    // both ADMIN and SUPER_ADMIN can bypass the approval flow
    private boolean isAdmin(Authentication auth) {
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> role.equals("ROLE_ADMIN") || role.equals("ROLE_SUPER_ADMIN"));
    }
}
