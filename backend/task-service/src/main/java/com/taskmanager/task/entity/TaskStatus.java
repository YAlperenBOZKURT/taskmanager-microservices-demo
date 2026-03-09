/**
 * Possible statuses a task can be in.
 * ACTIVE → PENDING (user marks as finished, awaiting approval)
 * PENDING → COMPLETED (admin/super_admin approves)
 * @author Yusuf Alperen Bozkurt
 */
package com.taskmanager.task.entity;

public enum TaskStatus {
    ACTIVE,
    PENDING,
    COMPLETED
}
