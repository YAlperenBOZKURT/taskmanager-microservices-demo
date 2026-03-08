/**
 * Password reset flow - generates tokens and handles the actual reset
 * @author Yusuf Alperen Bozkurt
 */
package com.taskmanager.auth.service;

import com.taskmanager.auth.dto.PasswordResetConfirmDto;
import com.taskmanager.auth.dto.PasswordResetRequestDto;
import com.taskmanager.auth.entity.PasswordResetToken;
import com.taskmanager.auth.entity.User;
import com.taskmanager.auth.exception.AuthException;
import com.taskmanager.auth.repository.PasswordResetTokenRepository;
import com.taskmanager.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    // token expires after 2 hours - should be enough time
    private static final int TOKEN_EXPIRY_HOURS = 2;

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public String requestPasswordReset(PasswordResetRequestDto dto) {
        log.info("Password reset requested for email: {}", dto.getEmail());

        User user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> {
                    log.error("Password reset failed - email not found: {}", dto.getEmail());
                    return new AuthException("User with this email not found", HttpStatus.NOT_FOUND);
                });

        String token = UUID.randomUUID().toString();

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiresAt(LocalDateTime.now().plusHours(TOKEN_EXPIRY_HOURS))
                .build();

        tokenRepository.save(resetToken);
        log.info("Password reset token generated for user: {} (expires in {} hours)",
                user.getUsername(), TOKEN_EXPIRY_HOURS);

        // In production, send token via email/notification service
        // For now, return the token directly (development only)
        return token;
    }

    @Transactional
    public void confirmPasswordReset(PasswordResetConfirmDto dto) {
        log.info("Password reset confirmation with token");

        PasswordResetToken resetToken = tokenRepository.findByTokenAndUsedFalse(dto.getToken())
                .orElseThrow(() -> {
                    log.error("Invalid or already used reset token");
                    return new AuthException("Invalid or expired reset token", HttpStatus.BAD_REQUEST);
                });

        if (resetToken.isExpired()) {
            log.error("Password reset token expired for user: {}", resetToken.getUser().getUsername());
            throw new AuthException("Reset token has expired", HttpStatus.BAD_REQUEST);
        }

        // reset password and also unlock the account if it was locked
        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        user.setLocked(false);
        user.setFailedLoginAttempts(0);
        userRepository.save(user);

        resetToken.setUsed(true);
        tokenRepository.save(resetToken);

        log.info("Password reset completed successfully for user: {}", user.getUsername());
    }
}
