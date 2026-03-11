package com.taskmanager.auth.service;

import com.taskmanager.auth.dto.ApprovalRequestDto;
import com.taskmanager.auth.dto.ApprovalReviewDto;
import com.taskmanager.auth.entity.ApprovalRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface IApprovalService {

    ApprovalRequest createApprovalRequest(String username, ApprovalRequestDto dto);

    Page<ApprovalRequest> getPendingRequests(Pageable pageable);

    Page<ApprovalRequest> getMyRequests(String username, Pageable pageable);

    ApprovalRequest reviewRequest(UUID requestId, String reviewerUsername, ApprovalReviewDto dto);
}
