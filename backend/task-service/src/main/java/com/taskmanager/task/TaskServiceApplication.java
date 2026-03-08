/**
 * Main entry point for the task service - kicks off the Spring Boot app.
 * @author Yusuf Alperen Bozkurt
 */
package com.taskmanager.task;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class TaskServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(TaskServiceApplication.class, args);
    }
}
