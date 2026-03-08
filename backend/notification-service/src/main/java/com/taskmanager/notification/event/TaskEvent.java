/**
 * Event model for task lifecycle messages from task-service
 * @author Yusuf Alperen Bozkurt
 */
package com.taskmanager.notification.event;

import lombok.*;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskEvent {

    private UUID taskId;
    private String title;
    private String eventType;
    private UUID creatorId;
    private UUID approverId;
    private UUID teamLeaderId;
    private Set<UUID> assigneeIds;
    private String status;
    private String priority;
    private LocalDateTime timestamp;
}
