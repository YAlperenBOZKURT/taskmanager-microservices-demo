/**
 * Kafka setup and all the topic names we listen to in one place
 * @author Yusuf Alperen Bozkurt
 */
package com.taskmanager.notification.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;

@Configuration
@EnableKafka
public class KafkaConfig {

    // Auth Service topics
    public static final String USER_REGISTERED_TOPIC = "user-registered";
    public static final String USER_UPDATED_TOPIC = "user-updated";

    // Task Service topics
    public static final String TASK_CREATED_TOPIC = "task-created";
    public static final String TASK_UPDATED_TOPIC = "task-updated";
    public static final String TASK_DELETED_TOPIC = "task-deleted";
    public static final String TASK_ASSIGNED_TOPIC = "task-assigned";
    public static final String TASK_APPROVAL_REQUESTED_TOPIC = "task-approval-requested";
    public static final String TASK_APPROVAL_REVIEWED_TOPIC = "task-approval-reviewed";
}
