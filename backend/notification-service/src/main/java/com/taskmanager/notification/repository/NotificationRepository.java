/**
 * Mongo repo for notifications - Spring Data does the heavy lifting here
 */
package com.taskmanager.notification.repository;

import com.taskmanager.notification.document.Notification;
import com.taskmanager.notification.document.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {

    Page<Notification> findByRecipientUserIdOrderByCreatedAtDesc(String recipientUserId, Pageable pageable);

    List<Notification> findByRecipientUserIdAndReadFalseOrderByCreatedAtDesc(String recipientUserId);

    long countByRecipientUserIdAndReadFalse(String recipientUserId);

    Page<Notification> findByTypeOrderByCreatedAtDesc(NotificationType type, Pageable pageable);
}
