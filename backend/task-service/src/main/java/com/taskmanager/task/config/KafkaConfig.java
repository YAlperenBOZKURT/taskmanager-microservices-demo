/**
 * Kafka topic definitions - 3 partitions each, single replica (good enough for dev).
 */
package com.taskmanager.task.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaConfig {

    // topic names as constants so other classes can reference them
    public static final String TASK_CREATED_TOPIC = "task-created";
    public static final String TASK_UPDATED_TOPIC = "task-updated";
    public static final String TASK_DELETED_TOPIC = "task-deleted";
    public static final String TASK_ASSIGNED_TOPIC = "task-assigned";
    public static final String TASK_APPROVAL_REQUESTED_TOPIC = "task-approval-requested";
    public static final String TASK_APPROVAL_REVIEWED_TOPIC = "task-approval-reviewed";

    @Bean
    public NewTopic taskCreatedTopic() {
        return TopicBuilder.name(TASK_CREATED_TOPIC)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic taskUpdatedTopic() {
        return TopicBuilder.name(TASK_UPDATED_TOPIC)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic taskDeletedTopic() {
        return TopicBuilder.name(TASK_DELETED_TOPIC)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic taskAssignedTopic() {
        return TopicBuilder.name(TASK_ASSIGNED_TOPIC)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic taskApprovalRequestedTopic() {
        return TopicBuilder.name(TASK_APPROVAL_REQUESTED_TOPIC)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic taskApprovalReviewedTopic() {
        return TopicBuilder.name(TASK_APPROVAL_REVIEWED_TOPIC)
                .partitions(3)
                .replicas(1)
                .build();
    }
}
