package com.taskmanager.task.dto;

import com.taskmanager.task.entity.TaskProgressEntry;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskProgressEntryDto {

    private UUID id;
    private UUID taskId;
    private String message;
    private UUID createdBy;
    private String createdByUsername;
    private LocalDateTime createdAt;

    public static TaskProgressEntryDto fromEntity(TaskProgressEntry entry) {
        return TaskProgressEntryDto.builder()
                .id(entry.getId())
                .taskId(entry.getTask().getId())
                .message(entry.getMessage())
                .createdBy(entry.getCreatedBy())
                .createdByUsername(entry.getCreatedByUsername())
                .createdAt(entry.getCreatedAt())
                .build();
    }
}
