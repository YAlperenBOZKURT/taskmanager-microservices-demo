/**
 * Endpoints for regular users - profile, password change, approval requests
 */
package com.taskmanager.auth.controller;

import com.taskmanager.auth.dto.*;
import com.taskmanager.auth.entity.ApprovalRequest;
import com.taskmanager.auth.service.IApprovalService;
import com.taskmanager.auth.service.IUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User", description = "User profile, password and approval request operations")
public class UserController {

    private final IUserService userService;
    private final IApprovalService approvalService;

    @GetMapping("/me")
    @Operation(summary = "Get current user profile")
    public ResponseEntity<UserDto> getCurrentUser(Authentication authentication) {
        log.info("GET /api/users/me - user: {}", authentication.getName());
        UserDto user = userService.getCurrentUser(authentication.getName());
        return ResponseEntity.ok(user);
    }

    @PostMapping("/me/change-password")
    @Operation(summary = "Change password", description = "Change current user's password")
    public ResponseEntity<Map<String, String>> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordDto dto) {
        log.info("POST /api/users/me/change-password - user: {}", authentication.getName());
        userService.changePassword(authentication.getName(), dto);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    @PostMapping("/me/approval-request")
    @Operation(summary = "Submit profile change request", description = "Creates an approval request for profile changes")
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
    @Operation(summary = "Get my approval requests")
    public ResponseEntity<Page<Map<String, Object>>> getMyApprovalRequests(
            Authentication authentication,
            Pageable pageable) {
        log.info("GET /api/users/me/approval-requests - user: {}", authentication.getName());
        Page<Map<String, Object>> requests = approvalService.getMyRequests(authentication.getName(), pageable)
                .map(this::mapApprovalRequest);
        return ResponseEntity.ok(requests);
    }

    @PatchMapping("/me/profile")
    @Operation(summary = "Update own profile", description = "Update fullName and email")
    public ResponseEntity<UserDto> updateMyProfile(
            Authentication authentication,
            @RequestBody Map<String, String> body) {
        log.info("PATCH /api/users/me/profile - user: {}", authentication.getName());
        // users can only update their own profile, not team (that's admin-only)
        UserDto currentUser = userService.getCurrentUser(authentication.getName());
        UserDto updated = userService.updateUserProfile(
                currentUser.getId(),
                body.get("fullName"),
                body.get("email")
        );
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/team-members")
    @Operation(summary = "Get team members by team name")
    public ResponseEntity<Page<UserDto>> getTeamMembers(
            @RequestParam String team,
            Pageable pageable) {
        log.info("GET /api/users/team-members?team={}", team);
        Page<UserDto> users = userService.getUsersByTeam(team, pageable);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/teams")
    @Operation(summary = "Get current user's teams")
    public ResponseEntity<List<String>> getMyTeams(Authentication authentication) {
        log.info("GET /api/users/teams - user: {}", authentication.getName());
        UserDto currentUser = userService.getCurrentUser(authentication.getName());
        return ResponseEntity.ok(currentUser.getTeams() != null
                ? currentUser.getTeams().stream().sorted().toList()
                : List.of());
    }

    @GetMapping("/all-teams")
    @Operation(summary = "Get all teams in the system")
    public ResponseEntity<List<String>> getAllTeams() {
        log.info("GET /api/users/all-teams");
        return ResponseEntity.ok(userService.getAllTeams());
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
