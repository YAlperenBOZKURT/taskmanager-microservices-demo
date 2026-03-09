/**
 * DTO for admin reviewing an approval request - approve or reject
 */
package com.taskmanager.auth.dto;

import com.taskmanager.auth.entity.ApprovalStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalReviewDto {

    @NotNull(message = "Status is required (APPROVED or REJECTED)")
    private ApprovalStatus status;

    private String reviewNote;
}
