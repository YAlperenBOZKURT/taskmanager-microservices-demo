/**
 * Admin-only endpoints - user management, role assignment, approval reviews
 * @author Yusuf Alperen Bozkurt
 */
package com.taskmanager.auth.controller;

import com.taskmanager.auth.dto.ApprovalReviewDto;
import com.taskmanager.auth.dto.RegisterRequest;
import com.taskmanager.auth.dto.UserDto;
import com.taskmanager.auth.entity.ApprovalRequest;
import com.taskmanager.auth.entity.Role;
import com.taskmanager.auth.service.ApprovalService;
import com.taskmanager.auth.service.AuthService;
import com.taskmanager.auth.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserService userService;
    private final AuthService authService;
    private final ApprovalService approvalService;

    @PostMapping("/users")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<UserDto> createUser(@Valid @RequestBody RegisterRequest request) {
        log.info("POST /api/admin/users - creating user: {}", request.getUsername());
        UserDto user = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }

    @GetMapping("/users")
    public ResponseEntity<Page<UserDto>> getAllUsers(Pageable pageable) {
        log.info("GET /api/admin/users - page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());
        Page<UserDto> users = userService.getAllUsers(pageable);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<UserDto> getUserById(@PathVariable UUID userId) {
        log.info("GET /api/admin/users/{}", userId);
        UserDto user = userService.getUserById(userId);
        return ResponseEntity.ok(user);
    }

    @PatchMapping("/users/{userId}/status")
    public ResponseEntity<UserDto> toggleUserStatus(
            @PathVariable UUID userId,
            @RequestBody Map<String, Boolean> body) {
        boolean enabled = body.getOrDefault("enabled", true);
        log.info("PATCH /api/admin/users/{}/status - enabled: {}", userId, enabled);
        UserDto user = userService.toggleUserStatus(userId, enabled);
        return ResponseEntity.ok(user);
    }

    @DeleteMapping("/users/{userId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable UUID userId) {
        log.info("DELETE /api/admin/users/{}", userId);
        userService.deleteUser(userId);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }

    @PutMapping("/users/{userId}/roles")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<UserDto> assignRoles(
            @PathVariable UUID userId,
            @RequestBody Map<String, Set<Role>> body) {
        Set<Role> roles = body.get("roles");
        log.info("PUT /api/admin/users/{}/roles - roles: {}", userId, roles);
        UserDto user = userService.assignRoles(userId, roles);
        return ResponseEntity.ok(user);
    }

    @PatchMapping("/users/{userId}/team")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<UserDto> updateUserTeam(
            @PathVariable UUID userId,
            @RequestBody Map<String, String> body) {
        String team = body.get("team");
        log.info("PATCH /api/admin/users/{}/team - team: {}", userId, team);
        UserDto user = userService.updateUserTeam(userId, team);
        return ResponseEntity.ok(user);
    }

    @GetMapping("/users/by-team")
    public ResponseEntity<Page<UserDto>> getUsersByTeam(
            @RequestParam String team,
            Pageable pageable) {
        log.info("GET /api/admin/users/by-team?team={}", team);
        Page<UserDto> users = userService.getUsersByTeam(team, pageable);
        return ResponseEntity.ok(users);
    }

    @PatchMapping("/users/{userId}/profile")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<UserDto> updateUserProfile(
            @PathVariable UUID userId,
            @RequestBody Map<String, String> body) {
        log.info("PATCH /api/admin/users/{}/profile", userId);
        UserDto user = userService.updateUserProfile(
                userId,
                body.get("fullName"),
                body.get("email"),
                body.get("team")
        );
        return ResponseEntity.ok(user);
    }

    @GetMapping("/approval-requests")
    public ResponseEntity<Page<Map<String, Object>>> getPendingApprovalRequests(Pageable pageable) {
        log.info("GET /api/admin/approval-requests - page: {}", pageable.getPageNumber());
        Page<Map<String, Object>> requests = approvalService.getPendingRequests(pageable)
                .map(this::mapApprovalRequest);
        return ResponseEntity.ok(requests);
    }

    @PostMapping("/approval-requests/{requestId}/review")
    public ResponseEntity<Map<String, Object>> reviewApprovalRequest(
            @PathVariable UUID requestId,
            Authentication authentication,
            @Valid @RequestBody ApprovalReviewDto dto) {
        log.info("POST /api/admin/approval-requests/{}/review - reviewer: {}, status: {}",
                requestId, authentication.getName(), dto.getStatus());

        ApprovalRequest reviewed = approvalService.reviewRequest(requestId, authentication.getName(), dto);

        return ResponseEntity.ok(Map.of(
                "message", "Request reviewed successfully",
                "requestId", reviewed.getId().toString(),
                "status", reviewed.getStatus().name()
        ));
    }

    private Map<String, Object> mapApprovalRequest(ApprovalRequest req) {
        return Map.of(
                "id", req.getId().toString(),
                "requesterId", req.getRequester().getId().toString(),
                "requesterUsername", req.getRequester().getUsername(),
                "requestedFullName", req.getRequestedFullName() != null ? req.getRequestedFullName() : "",
                "requestedEmail", req.getRequestedEmail() != null ? req.getRequestedEmail() : "",
                "reason", req.getReason() != null ? req.getReason() : "",
                "status", req.getStatus().name(),
                "createdAt", req.getCreatedAt().toString()
        );
    }
}
