/**
 * All the different kinds of notifications we can send
 * @author Yusuf Alperen Bozkurt
 */
package com.taskmanager.notification.document;

public enum NotificationType {
    USER_REGISTERED,
    USER_UPDATED,
    TASK_CREATED,
    TASK_UPDATED,
    TASK_DELETED,
    TASK_ASSIGNED,
    TASK_APPROVAL_REQUESTED,
    TASK_APPROVAL_REVIEWED,
    SYSTEM
}
