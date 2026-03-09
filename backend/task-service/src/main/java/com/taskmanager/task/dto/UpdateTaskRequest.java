/**
 * DTO for updating an existing task - all fields are optional so you can partial update.
 * Status changes are handled via dedicated endpoints (mark-pending/approve-completion).
 */
package com.taskmanager.task.dto;

import com.taskmanager.task.entity.TaskPriority;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTaskRequest {

    @Size(min = 3, max = 200, message = "Title must be between 3 and 200 characters")
    private String title;

    private String description;

    private String team;

    private TaskPriority priority;

    private Set<UUID> assigneeIds;

    @FutureOrPresent(message = "Due date must not be in the past")
    private LocalDateTime dueDate;
}
