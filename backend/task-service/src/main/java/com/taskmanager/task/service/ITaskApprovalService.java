package com.taskmanager.task.service;

import com.taskmanager.task.dto.ApprovalReviewRequest;
import com.taskmanager.task.dto.TaskApprovalRequestDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Set;
import java.util.UUID;

public interface ITaskApprovalService {

    Page<TaskApprovalRequestDto> getPendingRequests(Set<String> reviewerTeams,
                                                    boolean isSuperAdmin, Pageable pageable);

    Page<TaskApprovalRequestDto> getMyRequests(UUID userId, Pageable pageable);

    Page<TaskApprovalRequestDto> getAllRequests(Set<String> reviewerTeams,
                                               boolean isSuperAdmin, Pageable pageable);

    TaskApprovalRequestDto reviewRequest(UUID requestId, ApprovalReviewRequest review,
                                         UUID reviewerId, String reviewerUsername);
}
