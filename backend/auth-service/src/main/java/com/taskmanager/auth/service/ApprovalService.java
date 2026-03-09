/**
 * Approval workflow for user profile changes - users request, admins approve/reject
 */
package com.taskmanager.auth.service;

import com.taskmanager.auth.config.KafkaConfig;
import com.taskmanager.auth.dto.ApprovalRequestDto;
import com.taskmanager.auth.dto.ApprovalReviewDto;
import com.taskmanager.auth.entity.ApprovalRequest;
import com.taskmanager.auth.entity.ApprovalStatus;
import com.taskmanager.auth.entity.User;
import com.taskmanager.auth.exception.AuthException;
import com.taskmanager.auth.repository.ApprovalRequestRepository;
import com.taskmanager.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ApprovalService {

    private final ApprovalRequestRepository approvalRequestRepository;
    private final UserRepository userRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Transactional
    public ApprovalRequest createApprovalRequest(String username, ApprovalRequestDto dto) {
        log.info("Creating approval request for user: {}", username);

        User requester = userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    log.error("User not found for approval request: {}", username);
                    return new AuthException("User not found", HttpStatus.NOT_FOUND);
                });

        // check if the new email is already taken by someone else
        if (dto.getRequestedEmail() != null
                && !dto.getRequestedEmail().equals(requester.getEmail())
                && userRepository.existsByEmail(dto.getRequestedEmail())) {
            log.error("Requested email already in use: {}", dto.getRequestedEmail());
            throw new AuthException("Email already in use", HttpStatus.CONFLICT);
        }

        ApprovalRequest request = ApprovalRequest.builder()
                .requester(requester)
                .requestedFullName(dto.getRequestedFullName())
                .requestedEmail(dto.getRequestedEmail())
                .reason(dto.getReason())
                .build();

        ApprovalRequest saved = approvalRequestRepository.save(request);
        log.info("Approval request created: id={} by user: {}", saved.getId(), username);
        return saved;
    }

    public Page<ApprovalRequest> getPendingRequests(Pageable pageable) {
        log.info("Fetching pending approval requests");
        return approvalRequestRepository.findByStatus(ApprovalStatus.PENDING, pageable);
    }

    public Page<ApprovalRequest> getMyRequests(String username, Pageable pageable) {
        log.info("Fetching approval requests for user: {}", username);

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AuthException("User not found", HttpStatus.NOT_FOUND));

        return approvalRequestRepository.findByRequesterId(user.getId(), pageable);
    }

    @Transactional
    public ApprovalRequest reviewRequest(UUID requestId, String reviewerUsername, ApprovalReviewDto dto) {
        log.info("Reviewing approval request: id={}, reviewer={}, status={}",
                requestId, reviewerUsername, dto.getStatus());

        ApprovalRequest request = approvalRequestRepository.findById(requestId)
                .orElseThrow(() -> {
                    log.error("Approval request not found: {}", requestId);
                    return new AuthException("Approval request not found", HttpStatus.NOT_FOUND);
                });

        if (request.getStatus() != ApprovalStatus.PENDING) {
            log.error("Approval request already reviewed: id={}, status={}", requestId, request.getStatus());
            throw new AuthException("Request already reviewed", HttpStatus.BAD_REQUEST);
        }

        User reviewer = userRepository.findByUsername(reviewerUsername)
                .orElseThrow(() -> new AuthException("Reviewer not found", HttpStatus.NOT_FOUND));

        request.setStatus(dto.getStatus());
        request.setReviewedBy(reviewer);
        request.setReviewNote(dto.getReviewNote());

        // if approved, apply the requested changes to the user's profile
        if (dto.getStatus() == ApprovalStatus.APPROVED) {
            User requester = request.getRequester();
            if (request.getRequestedFullName() != null) {
                requester.setFullName(request.getRequestedFullName());
            }
            if (request.getRequestedEmail() != null) {
                requester.setEmail(request.getRequestedEmail());
            }
            userRepository.save(requester);
            log.info("Approval request approved - user info updated for: {}", requester.getUsername());

            // notify other services about the profile update via kafka
            kafkaTemplate.send(KafkaConfig.USER_UPDATED_TOPIC, Map.of(
                    "userId", requester.getId().toString(),
                    "username", requester.getUsername(),
                    "email", requester.getEmail(),
                    "fullName", requester.getFullName() != null ? requester.getFullName() : ""
            ));
        } else {
            log.info("Approval request rejected: id={}", requestId);
        }

        return approvalRequestRepository.save(request);
    }
}
