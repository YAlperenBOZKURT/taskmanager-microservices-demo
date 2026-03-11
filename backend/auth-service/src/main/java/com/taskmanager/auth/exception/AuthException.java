package com.taskmanager.auth.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class AuthException extends RuntimeException {

    private final HttpStatus status;
    private final ErrorCode errorCode;

    public AuthException(String message, HttpStatus status) {
        super(message);
        this.status = status;
        this.errorCode = null;
    }

    public AuthException(ErrorCode errorCode) {
        super(errorCode.getDefaultMessage());
        this.status = errorCode.getHttpStatus();
        this.errorCode = errorCode;
    }

    public AuthException(ErrorCode errorCode, String customMessage) {
        super(customMessage);
        this.status = errorCode.getHttpStatus();
        this.errorCode = errorCode;
    }
}
