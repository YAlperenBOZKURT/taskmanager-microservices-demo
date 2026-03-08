/**
 * Main entry point for the auth service - kicks off the Spring Boot app
 * @author Yusuf Alperen Bozkurt
 */
package com.taskmanager.auth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class AuthServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(AuthServiceApplication.class, args);
    }
}
