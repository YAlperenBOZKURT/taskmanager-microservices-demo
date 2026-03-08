/**
 * Main entry point for the notification microservice - fires up Spring Boot
 * @author Yusuf Alperen Bozkurt
 */
package com.taskmanager.notification;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class NotificationServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(NotificationServiceApplication.class, args);
    }
}
