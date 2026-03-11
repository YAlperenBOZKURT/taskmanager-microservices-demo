package com.taskmanager.notification.service;

import com.taskmanager.notification.document.Notification;
import com.taskmanager.notification.document.NotificationType;
import com.taskmanager.notification.dto.NotificationDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;

public interface INotificationService {

    Notification createAndSend(String recipientUserId, String recipientEmail,
                               String title, String message, NotificationType type,
                               String referenceId, String referenceType,
                               Map<String, Object> metadata);

    Page<NotificationDto> getNotifications(String userId, Pageable pageable);

    List<NotificationDto> getUnreadNotifications(String userId);

    long getUnreadCount(String userId);
   
    NotificationDto markAsRead(String notificationId);

    void markAllAsRead(String userId);                                         
}       
