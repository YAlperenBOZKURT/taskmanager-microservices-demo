/**
 * Endpoints for the approval workflow - admins can see pending requests,
 * review them, and regular users can check their own request status.
 * @author Yusuf Alperen Bozkurt
 */
package com.taskmanager.task.controller;

import com.taskmanager.task.dto.ApprovalReviewRequest;
import com.taskmanager.task.dto.TaskApprovalRequestDto;
import com.taskmanager.task.service.TaskApprovalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/tasks/approvals")
@RequiredArgsConstructor
public class TaskApprovalController {

    private final TaskApprovalService approvalService;

    // only admins should see pending requests - enforced with @PreAuthorize
    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Page<TaskApprovalRequestDto>> getPendingRequests(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(approvalService.getPendingRequests(pageable));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Page<TaskApprovalRequestDto>> getAllRequests(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(approvalService.getAllRequests(pageable));
    }

    // regular users can check on their own requests here
    @GetMapping("/my-requests")
    public ResponseEntity<Page<TaskApprovalRequestDto>> getMyRequests(
            Authentication auth,
            @PageableDefault(size = 20) Pageable pageable) {
        UUID userId = UUID.fromString((String) auth.getCredentials());
        return ResponseEntity.ok(approvalService.getMyRequests(userId, pageable));
    }

    @PostMapping("/{requestId}/review")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<TaskApprovalRequestDto> reviewRequest(
            @PathVariable UUID requestId,
            @Valid @RequestBody ApprovalReviewRequest review,
            Authentication auth) {
        UUID reviewerId = UUID.fromString((String) auth.getCredentials());
        String reviewerUsername = auth.getName();
        return ResponseEntity.ok(approvalService.reviewRequest(requestId, review, reviewerId, reviewerUsername));
    }
}
