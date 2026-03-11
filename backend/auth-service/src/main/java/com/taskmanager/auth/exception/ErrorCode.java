package com.taskmanager.auth.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // Auth errors
    USERNAME_ALREADY_EXISTS("AUTH_001", "Username already exists", HttpStatus.CONFLICT),
    EMAIL_ALREADY_EXISTS("AUTH_002", "Email already exists", HttpStatus.CONFLICT),
    INVALID_CREDENTIALS("AUTH_003", "Invalid username or password", HttpStatus.UNAUTHORIZED),
    ACCOUNT_LOCKED("AUTH_004", "Account is locked due to too many failed attempts", HttpStatus.LOCKED),
    INVALID_REFRESH_TOKEN("AUTH_005", "Invalid or expired refresh token", HttpStatus.UNAUTHORIZED),
    REFRESH_TOKEN_EXPIRED("AUTH_006", "Refresh token expired", HttpStatus.UNAUTHORIZED),

    // User errors
    USER_NOT_FOUND("USER_001", "User not found", HttpStatus.NOT_FOUND),
    CURRENT_PASSWORD_INCORRECT("USER_002", "Current password is incorrect", HttpStatus.BAD_REQUEST),
    EMAIL_IN_USE("USER_003", "Email already in use", HttpStatus.CONFLICT),

    // Approval errors
    APPROVAL_NOT_FOUND("APPROVAL_001", "Approval request not found", HttpStatus.NOT_FOUND),
    APPROVAL_ALREADY_REVIEWED("APPROVAL_002", "Request already reviewed", HttpStatus.BAD_REQUEST),

    // Password reset errors
    RESET_EMAIL_NOT_FOUND("RESET_001", "User with this email not found", HttpStatus.NOT_FOUND),
    RESET_TOKEN_INVALID("RESET_002", "Invalid or expired reset token", HttpStatus.BAD_REQUEST),
    RESET_TOKEN_EXPIRED("RESET_003", "Reset token has expired", HttpStatus.BAD_REQUEST),

    // General
    ACCESS_DENIED("GEN_001", "Access denied", HttpStatus.FORBIDDEN),
    VALIDATION_FAILED("GEN_002", "Validation failed", HttpStatus.BAD_REQUEST),
    INTERNAL_ERROR("GEN_999", "An unexpected error occurred", HttpStatus.INTERNAL_SERVER_ERROR);

    private final String code;
    private final String defaultMessage;
    private final HttpStatus httpStatus;
}
