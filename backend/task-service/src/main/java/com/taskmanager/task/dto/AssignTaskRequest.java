/**
 * Request body for assigning users to a task.
 */
package com.taskmanager.task.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignTaskRequest {

    @NotEmpty(message = "At least one assignee is required")
    private Set<UUID> assigneeIds;
}
