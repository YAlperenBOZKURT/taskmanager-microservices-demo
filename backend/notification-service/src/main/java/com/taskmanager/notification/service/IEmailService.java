package com.taskmanager.notification.service;

public interface IEmailService {

    void sendEmail(String to, String subject, String htmlContent);
}
