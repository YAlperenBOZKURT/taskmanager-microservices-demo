/**
 * Repository for password reset tokens
 * @author Yusuf Alperen Bozkurt
 */
package com.taskmanager.auth.repository;

import com.taskmanager.auth.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {

    Optional<PasswordResetToken> findByTokenAndUsedFalse(String token);
}
