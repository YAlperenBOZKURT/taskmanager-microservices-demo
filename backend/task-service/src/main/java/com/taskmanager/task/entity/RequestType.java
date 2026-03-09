/**
 * Types of operations that can be requested through the approval flow.
 * Users submit these requests; admins/super_admins approve or reject.
 */
package com.taskmanager.task.entity;

public enum RequestType {
    CREATE,
    UPDATE,
    COMPLETION
}
