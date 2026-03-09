/**
 * Response DTO for tasks - maps from the Task entity to what we send to clients.
 * @author Yusuf Alperen Bozkurt
 */
package com.taskmanager.task.dto;

import com.taskmanager.task.entity.Task;
import com.taskmanager.task.entity.TaskPriority;
import com.taskmanager.task.entity.TaskStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskDto {

    private UUID id;
    private String title;
    private String description;
    private String team;
    private TaskStatus status;
    private TaskPriority priority;
    private UUID creatorId;
    private Set<UUID> assigneeIds;
    private LocalDateTime dueDate;
    private List<AttachmentDto> attachments;
    private List<TaskProgressEntryDto> progressEntries;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static TaskDto fromEntity(Task task) {
        List<AttachmentDto> attachmentDtos = task.getAttachments() != null
                ? task.getAttachments().stream().map(AttachmentDto::fromEntity).toList()
                : List.of();

        List<TaskProgressEntryDto> progressDtos = task.getProgressEntries() != null
                ? task.getProgressEntries().stream().map(TaskProgressEntryDto::fromEntity).toList()
                : List.of();

        return TaskDto.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .team(task.getTeam())
                .status(task.getStatus())
                .priority(task.getPriority())
                .creatorId(task.getCreatorId())
                .assigneeIds(task.getAssigneeIds())
                .dueDate(task.getDueDate())
                .attachments(attachmentDtos)
                .progressEntries(progressDtos)
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }
}
