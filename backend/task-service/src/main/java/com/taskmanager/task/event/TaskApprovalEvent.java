/**
 * Kafka event payload for approval workflow events.
 * @author Yusuf Alperen Bozkurt
 */
package com.taskmanager.task.event;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskApprovalEvent {

    private UUID approvalRequestId;
    private UUID taskId;
    private String requestType;
    private UUID requesterId;
    private String requesterUsername;
    private String approvalStatus;
    private UUID reviewedById;
    private String reviewedByUsername;
    private LocalDateTime timestamp;
}
