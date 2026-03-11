package com.taskmanager.auth.controller;

import com.taskmanager.auth.dto.*;
import com.taskmanager.auth.service.IAuthService;
import com.taskmanager.auth.service.IPasswordResetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Login, register, logout and token operations")
public class AuthController {

    private final IAuthService authService;
    private final IPasswordResetService passwordResetService;

    @PostMapping("/register")
    @Operation(summary = "Register a new user", description = "Creates a new user account (Admin/SuperAdmin only)")
    @ApiResponse(responseCode = "201", description = "User registered successfully")
    @ApiResponse(responseCode = "409", description = "Username or email already exists")
    public ResponseEntity<UserDto> register(@Valid @RequestBody RegisterRequest request) {
        log.info("POST /api/auth/register - username: {}", request.getUsername());
        UserDto user = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }

    @PostMapping("/login")
    @Operation(summary = "Login", description = "Authenticates user and returns JWT tokens")
    @ApiResponse(responseCode = "200", description = "Login successful")
    @ApiResponse(responseCode = "401", description = "Invalid credentials")
    @ApiResponse(responseCode = "423", description = "Account locked")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("POST /api/auth/login - username: {}", request.getUsername());
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh token", description = "Generates new access and refresh tokens")
    @ApiResponse(responseCode = "200", description = "Tokens refreshed successfully")
    @ApiResponse(responseCode = "401", description = "Invalid or expired refresh token")
    public ResponseEntity<AuthResponse> refreshToken(@RequestBody Map<String, String> body) {
        log.info("POST /api/auth/refresh");
        String refreshToken = body.get("refreshToken");
        AuthResponse response = authService.refreshToken(refreshToken);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout", description = "Invalidates access and refresh tokens")
    @ApiResponse(responseCode = "200", description = "Logged out successfully")
    public ResponseEntity<Map<String, String>> logout(
            @RequestHeader("Authorization") String authHeader,
            Authentication authentication) {
        log.info("POST /api/auth/logout - user: {}", authentication.getName());
        String accessToken = authHeader.substring(7);
        authService.logout(accessToken, authentication.getName());
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    @PostMapping("/password-reset/request")
    @Operation(summary = "Request password reset", description = "Generates a password reset token for the given email")
    @ApiResponse(responseCode = "200", description = "Reset token generated")
    @ApiResponse(responseCode = "404", description = "Email not found")
    public ResponseEntity<Map<String, String>> requestPasswordReset(
            @Valid @RequestBody PasswordResetRequestDto request) {
        log.info("POST /api/auth/password-reset/request - email: {}", request.getEmail());
        String token = passwordResetService.requestPasswordReset(request);
        return ResponseEntity.ok(Map.of(
                "message", "Password reset token generated",
                "token", token
        ));
    }

    @PostMapping("/password-reset/confirm")
    @Operation(summary = "Confirm password reset", description = "Resets the password using the reset token")
    @ApiResponse(responseCode = "200", description = "Password reset successful")
    @ApiResponse(responseCode = "400", description = "Invalid or expired token")
    public ResponseEntity<Map<String, String>> confirmPasswordReset(
            @Valid @RequestBody PasswordResetConfirmDto request) {
        log.info("POST /api/auth/password-reset/confirm");
        passwordResetService.confirmPasswordReset(request);
        return ResponseEntity.ok(Map.of("message", "Password reset successful"));
    }
}
