/**
 * Types of operations that can be requested through the approval flow.
 * Users submit these requests; admins/super_admins approve or reject.
 * @author Yusuf Alperen Bozkurt
 */
package com.taskmanager.task.entity;

public enum RequestType {
    CREATE,
    UPDATE,
    COMPLETION
}
