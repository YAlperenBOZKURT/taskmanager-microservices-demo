/**
 * Custom exception for task-related errors - carries an HTTP status code.
 */
package com.taskmanager.task.exception;

import org.springframework.http.HttpStatus;
import lombok.Getter;

@Getter
public class TaskException extends RuntimeException {

    private final HttpStatus status;

    public TaskException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }
}
