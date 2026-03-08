/**
 * Enables async method execution - mainly used by EmailService to send emails in background
 * @author Yusuf Alperen Bozkurt
 */
package com.taskmanager.notification.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

@Configuration
@EnableAsync
public class AsyncConfig {
}
