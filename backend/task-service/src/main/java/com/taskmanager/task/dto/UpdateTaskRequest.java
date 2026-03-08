/**
 * DTO for updating an existing task - all fields are optional so you can partial update.
 * @author Yusuf Alperen Bozkurt
 */
package com.taskmanager.task.dto;

import com.taskmanager.task.entity.TaskPriority;
import com.taskmanager.task.entity.TaskStatus;
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

    private TaskStatus status;

    private TaskPriority priority;

    private UUID teamLeaderId;

    private Set<UUID> assigneeIds;

    private LocalDateTime dueDate;
}
