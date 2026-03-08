/**
 * Repo for approval requests - handles all the pending/approved/rejected queries.
 * @author Yusuf Alperen Bozkurt
 */
package com.taskmanager.task.repository;

import com.taskmanager.task.entity.ApprovalStatus;
import com.taskmanager.task.entity.TaskApprovalRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface TaskApprovalRequestRepository extends JpaRepository<TaskApprovalRequest, UUID> {

    Page<TaskApprovalRequest> findByStatus(ApprovalStatus status, Pageable pageable);

    Page<TaskApprovalRequest> findByRequesterId(UUID requesterId, Pageable pageable);

    Page<TaskApprovalRequest> findByRequesterIdAndStatus(UUID requesterId, ApprovalStatus status, Pageable pageable);
}
