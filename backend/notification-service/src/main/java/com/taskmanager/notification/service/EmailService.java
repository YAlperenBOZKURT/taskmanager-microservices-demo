/**
 * Async email sender - wraps JavaMailSender with a toggle to disable emails in dev
 */
package com.taskmanager.notification.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@taskmanager.com}")
    private String fromAddress;

    @Value("${notification.email.enabled:false}")
    private boolean emailEnabled;

    // runs async so we don't block the main thread waiting for SMTP
    @Async
    public void sendEmail(String to, String subject, String htmlContent) {
        // skip if email is turned off (handy during local dev)
        if (!emailEnabled) {
            log.info("Email sending disabled. Would send to={}, subject={}", to, subject);
            return;
        }

        if (to == null || to.isBlank()) {
            log.warn("Cannot send email: recipient address is empty. subject={}", subject);
            return;
        }

        try {
            // build and send the mime message with html content
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Email sent successfully to={}, subject={}", to, subject);
        } catch (MessagingException e) {
            log.error("Failed to send email to={}, subject={}: {}", to, subject, e.getMessage());
        }
    }
}
