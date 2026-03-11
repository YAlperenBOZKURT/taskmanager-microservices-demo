package com.taskmanager.task.service;

import com.taskmanager.task.entity.Task;
import com.taskmanager.task.entity.TaskApprovalRequest;

public interface ITaskEventPublisher {

    void sendTaskCreated(Task task);

    void sendTaskUpdated(Task task);

    void sendTaskDeleted(Task task);

    void sendTaskAssigned(Task task);

    void sendApprovalRequested(TaskApprovalRequest request);

    void sendApprovalReviewed(TaskApprovalRequest request);
}
