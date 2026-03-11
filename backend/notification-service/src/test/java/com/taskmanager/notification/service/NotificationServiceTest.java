package com.taskmanager.notification.service;

import com.taskmanager.notification.document.Notification;
import com.taskmanager.notification.document.NotificationType;
import com.taskmanager.notification.dto.NotificationDto;
import com.taskmanager.notification.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock private NotificationRepository notificationRepository;
    @Mock private IEmailService emailService;

    @InjectMocks
    private NotificationService notificationService;

    private Notification testNotification;

    @BeforeEach
    void setUp() {
        testNotification = Notification.builder()
                .id("notif-1")
                .recipientUserId("user-123")
                .recipientEmail("test@example.com")
                .title("Test Notification")
                .message("Test message")
                .type(NotificationType.TASK_CREATED)
                .read(false)
                .emailSent(false)
                .referenceId("task-1")
                .referenceType("TASK")
                .metadata(Map.of("taskId", "task-1"))
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    void createAndSend_savesNotification() {
        when(notificationRepository.save(any(Notification.class))).thenReturn(testNotification);

        Notification result = notificationService.createAndSend(
                "user-123", null, "Title", "Message",
                NotificationType.TASK_CREATED, "ref-1", "TASK", Map.of());

        assertNotNull(result);
        assertEquals("user-123", result.getRecipientUserId());
        verify(notificationRepository).save(any(Notification.class));
        verify(emailService, never()).sendEmail(anyString(), anyString(), anyString());
    }

    @Test
    void createAndSend_withEmail_sendsEmail() {
        when(notificationRepository.save(any(Notification.class))).thenReturn(testNotification);

        notificationService.createAndSend(
                "user-123", "test@example.com", "Title", "Message",
                NotificationType.TASK_CREATED, "ref-1", "TASK", Map.of());

        verify(emailService).sendEmail(eq("test@example.com"), eq("Title"), anyString());
        verify(notificationRepository, times(2)).save(any(Notification.class));
    }

    @Test
    void getNotifications_returnsPaginated() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Notification> page = new PageImpl<>(List.of(testNotification), pageable, 1);
        when(notificationRepository.findByRecipientUserIdOrderByCreatedAtDesc("user-123", pageable))
                .thenReturn(page);

        Page<NotificationDto> result = notificationService.getNotifications("user-123", pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals("Test Notification", result.getContent().get(0).getTitle());
    }

    @Test
    void getUnreadNotifications_returnsUnread() {
        when(notificationRepository.findByRecipientUserIdAndReadFalseOrderByCreatedAtDesc("user-123"))
                .thenReturn(List.of(testNotification));

        List<NotificationDto> result = notificationService.getUnreadNotifications("user-123");

        assertEquals(1, result.size());
        assertFalse(result.get(0).isRead());
    }

    @Test
    void getUnreadCount_returnsCount() {
        when(notificationRepository.countByRecipientUserIdAndReadFalse("user-123")).thenReturn(5L);

        long count = notificationService.getUnreadCount("user-123");

        assertEquals(5L, count);
    }

    @Test
    void markAsRead_success() {
        when(notificationRepository.findById("notif-1")).thenReturn(Optional.of(testNotification));
        when(notificationRepository.save(any(Notification.class))).thenReturn(testNotification);

        NotificationDto result = notificationService.markAsRead("notif-1");

        assertTrue(testNotification.isRead());
        verify(notificationRepository).save(testNotification);
    }

    @Test
    void markAsRead_notFound_throws() {
        when(notificationRepository.findById("ghost")).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> notificationService.markAsRead("ghost"));
    }

    @Test
    void markAllAsRead_marksAllUnread() {
        Notification n1 = Notification.builder().id("n1").recipientUserId("user-123").read(false).build();
        Notification n2 = Notification.builder().id("n2").recipientUserId("user-123").read(false).build();

        when(notificationRepository.findByRecipientUserIdAndReadFalseOrderByCreatedAtDesc("user-123"))
                .thenReturn(List.of(n1, n2));

        notificationService.markAllAsRead("user-123");

        assertTrue(n1.isRead());
        assertTrue(n2.isRead());
        verify(notificationRepository).saveAll(List.of(n1, n2));
    }
}
