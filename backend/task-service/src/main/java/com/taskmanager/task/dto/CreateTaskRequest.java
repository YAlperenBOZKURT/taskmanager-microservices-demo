/**
 * DTO for creating a new task - validates the basics like title length.
 * @author Yusuf Alperen Bozkurt
 */
package com.taskmanager.task.dto;

import com.taskmanager.task.entity.TaskPriority;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTaskRequest {

    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 200, message = "Title must be between 3 and 200 characters")
    private String title;

    private String description;

    private String team;

    private TaskPriority priority;

    private Set<UUID> assigneeIds;

    @FutureOrPresent(message = "Due date must not be in the past")
    private LocalDateTime dueDate;
}
