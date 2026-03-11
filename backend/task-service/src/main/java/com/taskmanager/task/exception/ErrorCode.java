package com.taskmanager.task.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // Task errors
    TASK_NOT_FOUND("TASK_001", "Task not found", HttpStatus.NOT_FOUND),
    TASK_ACCESS_DENIED("TASK_002", "You don't have access to this task's team", HttpStatus.FORBIDDEN),
    TASK_INVALID_STATUS("TASK_003", "Invalid task status transition", HttpStatus.BAD_REQUEST),
    TASK_DUE_DATE_PAST("TASK_004", "Due date must not be in the past", HttpStatus.BAD_REQUEST),
    TASK_SERIALIZATION_FAILED("TASK_005", "Failed to serialize request data", HttpStatus.INTERNAL_SERVER_ERROR),

    // Approval errors
    APPROVAL_NOT_FOUND("APPROVAL_001", "Approval request not found", HttpStatus.NOT_FOUND),
    APPROVAL_ALREADY_REVIEWED("APPROVAL_002", "This request has already been reviewed", HttpStatus.BAD_REQUEST),
    APPROVAL_EXECUTION_FAILED("APPROVAL_003", "Failed to execute approved request", HttpStatus.INTERNAL_SERVER_ERROR),

    // Attachment errors
    ATTACHMENT_NOT_FOUND("ATTACH_001", "Attachment not found", HttpStatus.NOT_FOUND),
    ATTACHMENT_ACCESS_DENIED("ATTACH_002", "You can only delete your own attachments", HttpStatus.FORBIDDEN),
    FILE_EMPTY("ATTACH_003", "File is empty", HttpStatus.BAD_REQUEST),
    FILE_TOO_LARGE("ATTACH_004", "File size exceeds maximum allowed size (50MB)", HttpStatus.PAYLOAD_TOO_LARGE),
    FILE_TYPE_NOT_ALLOWED("ATTACH_005", "Invalid file type", HttpStatus.BAD_REQUEST),
    FILE_UPLOAD_FAILED("ATTACH_006", "File upload failed", HttpStatus.INTERNAL_SERVER_ERROR),
    FILE_DOWNLOAD_FAILED("ATTACH_007", "File download failed", HttpStatus.INTERNAL_SERVER_ERROR),

    // General
    ACCESS_DENIED("GEN_001", "Access denied", HttpStatus.FORBIDDEN),
    VALIDATION_FAILED("GEN_002", "Validation failed", HttpStatus.BAD_REQUEST),
    INTERNAL_ERROR("GEN_999", "An unexpected error occurred", HttpStatus.INTERNAL_SERVER_ERROR);

    private final String code;
    private final String defaultMessage;
    private final HttpStatus httpStatus;
}
