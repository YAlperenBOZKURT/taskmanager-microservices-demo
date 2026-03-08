/**
 * Repository for profile change approval requests
 * @author Yusuf Alperen Bozkurt
 */
package com.taskmanager.auth.repository;

import com.taskmanager.auth.entity.ApprovalRequest;
import com.taskmanager.auth.entity.ApprovalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ApprovalRequestRepository extends JpaRepository<ApprovalRequest, UUID> {

    Page<ApprovalRequest> findByStatus(ApprovalStatus status, Pageable pageable);

    Page<ApprovalRequest> findByRequesterId(UUID requesterId, Pageable pageable);
}
