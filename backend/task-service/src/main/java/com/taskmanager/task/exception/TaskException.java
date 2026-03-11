package com.taskmanager.task.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class TaskException extends RuntimeException {

    private final HttpStatus status;
    private final ErrorCode errorCode;

    public TaskException(String message, HttpStatus status) {
        super(message);
        this.status = status;
        this.errorCode = null;
    }

    public TaskException(ErrorCode errorCode) {
        super(errorCode.getDefaultMessage());
        this.status = errorCode.getHttpStatus();
        this.errorCode = errorCode;
    }

    public TaskException(ErrorCode errorCode, String customMessage) {
        super(customMessage);
        this.status = errorCode.getHttpStatus();
        this.errorCode = errorCode;
    }
}
