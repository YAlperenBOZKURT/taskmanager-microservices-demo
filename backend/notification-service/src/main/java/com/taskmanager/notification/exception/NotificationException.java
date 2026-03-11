package com.taskmanager.notification.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class NotificationException extends RuntimeException {

    private final HttpStatus status;
    private final ErrorCode errorCode;

    public NotificationException(ErrorCode errorCode) {
        super(errorCode.getDefaultMessage());
        this.status = errorCode.getHttpStatus();
        this.errorCode = errorCode;
    }

    public NotificationException(ErrorCode errorCode, String customMessage) {
        super(customMessage);
        this.status = errorCode.getHttpStatus();
        this.errorCode = errorCode;
    }
}
