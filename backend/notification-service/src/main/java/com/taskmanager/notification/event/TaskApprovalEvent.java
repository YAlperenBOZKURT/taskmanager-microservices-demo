/**
 * Event model for task approval workflow messages (request/review)
 */
package com.taskmanager.notification.event;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
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
