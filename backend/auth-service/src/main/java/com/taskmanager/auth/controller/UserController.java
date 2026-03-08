/**
 * Endpoints for regular users - profile, password change, approval requests
 * @author Yusuf Alperen Bozkurt
 */
package com.taskmanager.auth.controller;

import com.taskmanager.auth.dto.*;
import com.taskmanager.auth.entity.ApprovalRequest;
import com.taskmanager.auth.service.ApprovalService;
import com.taskmanager.auth.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final ApprovalService approvalService;

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(Authentication authentication) {
        log.info("GET /api/users/me - user: {}", authentication.getName());
        UserDto user = userService.getCurrentUser(authentication.getName());
        return ResponseEntity.ok(user);
    }

    @PostMapping("/me/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordDto dto) {
        log.info("POST /api/users/me/change-password - user: {}", authentication.getName());
        userService.changePassword(authentication.getName(), dto);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    @PostMapping("/me/approval-request")
    public ResponseEntity<Map<String, Object>> createApprovalRequest(
            Authentication authentication,
            @Valid @RequestBody ApprovalRequestDto dto) {
        log.info("POST /api/users/me/approval-request - user: {}", authentication.getName());
        ApprovalRequest request = approvalService.createApprovalRequest(authentication.getName(), dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Approval request submitted",
                "requestId", request.getId().toString(),
                "status", request.getStatus().name()
        ));
    }

    @GetMapping("/me/approval-requests")
    public ResponseEntity<Page<Map<String, Object>>> getMyApprovalRequests(
            Authentication authentication,
            Pageable pageable) {
        log.info("GET /api/users/me/approval-requests - user: {}", authentication.getName());
        Page<Map<String, Object>> requests = approvalService.getMyRequests(authentication.getName(), pageable)
                .map(this::mapApprovalRequest);
        return ResponseEntity.ok(requests);
    }

    @PatchMapping("/me/profile")
    public ResponseEntity<UserDto> updateMyProfile(
            Authentication authentication,
            @RequestBody Map<String, String> body) {
        log.info("PATCH /api/users/me/profile - user: {}", authentication.getName());
        // users can only update their own profile, not team (that's admin-only)
        UserDto currentUser = userService.getCurrentUser(authentication.getName());
        UserDto updated = userService.updateUserProfile(
                currentUser.getId(),
                body.get("fullName"),
                body.get("email"),
                null // team can only be changed by admins
        );
        return ResponseEntity.ok(updated);
    }

    private Map<String, Object> mapApprovalRequest(ApprovalRequest req) {
        return Map.of(
                "id", req.getId().toString(),
                "requestedFullName", req.getRequestedFullName() != null ? req.getRequestedFullName() : "",
                "requestedEmail", req.getRequestedEmail() != null ? req.getRequestedEmail() : "",
                "reason", req.getReason() != null ? req.getReason() : "",
                "status", req.getStatus().name(),
                "createdAt", req.getCreatedAt().toString()
        );
    }
}
