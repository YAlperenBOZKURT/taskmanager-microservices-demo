/**
 * Kafka setup, topic name constants, and DLQ error handling configuration.
 * Failed messages are retried 3 times with exponential backoff before being
 * sent to a Dead Letter Topic (original-topic.DLT).
 */
package com.taskmanager.notification.config;

import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.boot.autoconfigure.kafka.KafkaProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.kafka.listener.CommonErrorHandler;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.kafka.support.serializer.JsonSerializer;
import org.springframework.util.backoff.ExponentialBackOff;

import java.util.HashMap;
import java.util.Map;

@Slf4j
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

    @Bean
    public ProducerFactory<String, Object> dlqProducerFactory(KafkaProperties kafkaProperties) {
        Map<String, Object> props = new HashMap<>();
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, kafkaProperties.getBootstrapServers());
        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        return new DefaultKafkaProducerFactory<>(props);
    }

    @Bean
    public KafkaTemplate<String, Object> dlqKafkaTemplate(ProducerFactory<String, Object> dlqProducerFactory) {
        return new KafkaTemplate<>(dlqProducerFactory);
    }

    @Bean
    public CommonErrorHandler kafkaErrorHandler(KafkaTemplate<String, Object> dlqKafkaTemplate) {
        DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(dlqKafkaTemplate);

        // 3 retries, starting at 1s, max 10s, multiplier 2x
        ExponentialBackOff backOff = new ExponentialBackOff(1000L, 2.0);
        backOff.setMaxAttempts(3);

        DefaultErrorHandler errorHandler = new DefaultErrorHandler(recoverer, backOff);
        errorHandler.setRetryListeners((record, ex, deliveryAttempt) ->
                log.warn("Kafka consumer retry attempt {} for topic={}, partition={}, offset={}: {}",
                        deliveryAttempt, record.topic(), record.partition(), record.offset(), ex.getMessage()));

        return errorHandler;
    }
}
