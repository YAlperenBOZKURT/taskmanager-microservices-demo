/**
 * Request body for when an admin reviews (approves/rejects) a pending request.
 */
package com.taskmanager.task.dto;

import com.taskmanager.task.entity.ApprovalStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalReviewRequest {

    @NotNull(message = "Status is required (APPROVED or REJECTED)")
    private ApprovalStatus status;

    private String reviewNote;
}
