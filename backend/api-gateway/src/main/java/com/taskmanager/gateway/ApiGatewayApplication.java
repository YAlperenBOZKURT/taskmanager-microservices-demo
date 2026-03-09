/**
 * Main entry point for the API Gateway service.
 * This is basically the front door - all requests hit here first before going to other microservices.
 */
package com.taskmanager.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ApiGatewayApplication {

    // just boots up the gateway, routing and filters are configured in application.yml
    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }
}
