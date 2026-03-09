/**
 * DTO for approval requests - shows users the status of their pending requests.
 */
package com.taskmanager.task.dto;

import com.taskmanager.task.entity.ApprovalStatus;
import com.taskmanager.task.entity.RequestType;
import com.taskmanager.task.entity.TaskApprovalRequest;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskApprovalRequestDto {

    private UUID id;
    private RequestType requestType;
    private UUID taskId;
    private UUID requesterId;
    private String requesterUsername;
    private ApprovalStatus status;
    private String requestData;
    private UUID reviewedById;
    private String reviewedByUsername;
    private String reviewNote;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static TaskApprovalRequestDto fromEntity(TaskApprovalRequest entity) {
        return TaskApprovalRequestDto.builder()
                .id(entity.getId())
                .requestType(entity.getRequestType())
                .taskId(entity.getTaskId())
                .requesterId(entity.getRequesterId())
                .requesterUsername(entity.getRequesterUsername())
                .status(entity.getStatus())
                .requestData(entity.getRequestData())
                .reviewedById(entity.getReviewedById())
                .reviewedByUsername(entity.getReviewedByUsername())
                .reviewNote(entity.getReviewNote())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
