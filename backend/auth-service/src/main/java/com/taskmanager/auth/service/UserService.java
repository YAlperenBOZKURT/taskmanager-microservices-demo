/**
 * Handles user management operations - profile, password changes, role assignments, etc.
 * @author Yusuf Alperen Bozkurt
 */
package com.taskmanager.auth.service;

import com.taskmanager.auth.dto.ChangePasswordDto;
import com.taskmanager.auth.dto.UserDto;
import com.taskmanager.auth.entity.Role;
import com.taskmanager.auth.entity.User;
import com.taskmanager.auth.exception.AuthException;
import com.taskmanager.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserDto getCurrentUser(String username) {
        log.info("Fetching current user profile: {}", username);

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    log.error("User not found: {}", username);
                    return new AuthException("User not found", HttpStatus.NOT_FOUND);
                });

        return UserDto.fromEntity(user);
    }

    public Page<UserDto> getAllUsers(Pageable pageable) {
        log.info("Fetching all users - page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());
        return userRepository.findAll(pageable).map(UserDto::fromEntity);
    }

    public UserDto getUserById(UUID userId) {
        log.info("Fetching user by id: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.error("User not found with id: {}", userId);
                    return new AuthException("User not found", HttpStatus.NOT_FOUND);
                });

        return UserDto.fromEntity(user);
    }

    @Transactional
    public void changePassword(String username, ChangePasswordDto dto) {
        log.info("Password change requested for user: {}", username);

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AuthException("User not found", HttpStatus.NOT_FOUND));

        // verify the old password first before letting them change it
        if (!passwordEncoder.matches(dto.getCurrentPassword(), user.getPassword())) {
            log.error("Password change failed - current password mismatch for user: {}", username);
            throw new AuthException("Current password is incorrect", HttpStatus.BAD_REQUEST);
        }

        user.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        userRepository.save(user);

        log.info("Password changed successfully for user: {}", username);
    }

    @Transactional
    public UserDto toggleUserStatus(UUID userId, boolean enabled) {
        log.info("Toggling user status: userId={}, enabled={}", userId, enabled);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.error("User not found for status toggle: {}", userId);
                    return new AuthException("User not found", HttpStatus.NOT_FOUND);
                });

        // also reset lock status and failed attempts when toggling
        user.setEnabled(enabled);
        user.setLocked(false);
        user.setFailedLoginAttempts(0);
        User saved = userRepository.save(user);

        log.info("User status updated: userId={}, enabled={}", userId, enabled);
        return UserDto.fromEntity(saved);
    }

    @Transactional
    public UserDto assignRoles(UUID userId, Set<Role> roles) {
        log.info("Assigning roles to user: userId={}, roles={}", userId, roles);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.error("User not found for role assignment: {}", userId);
                    return new AuthException("User not found", HttpStatus.NOT_FOUND);
                });

        user.setRoles(roles);
        User saved = userRepository.save(user);

        log.info("Roles assigned successfully: userId={}, roles={}", userId, roles);
        return UserDto.fromEntity(saved);
    }

    @Transactional
    public void deleteUser(UUID userId) {
        log.info("Deleting user: {}", userId);

        if (!userRepository.existsById(userId)) {
            log.error("User not found for deletion: {}", userId);
            throw new AuthException("User not found", HttpStatus.NOT_FOUND);
        }

        userRepository.deleteById(userId);
        log.info("User deleted successfully: {}", userId);
    }

    @Transactional
    public UserDto updateUserTeam(UUID userId, String team) {
        log.info("Updating team for user: userId={}, team={}", userId, team);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AuthException("User not found", HttpStatus.NOT_FOUND));

        user.setTeam(team);
        User saved = userRepository.save(user);
        return UserDto.fromEntity(saved);
    }

    public Page<UserDto> getUsersByTeam(String team, Pageable pageable) {
        log.info("Fetching users by team: {}", team);
        return userRepository.findByTeam(team, pageable).map(UserDto::fromEntity);
    }

    @Transactional
    public UserDto updateUserProfile(UUID userId, String fullName, String email, String team) {
        log.info("Updating profile for user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AuthException("User not found", HttpStatus.NOT_FOUND));

        if (fullName != null) user.setFullName(fullName);
        if (email != null) {
            // make sure nobody else already has this email
            if (userRepository.findByEmail(email).filter(u -> !u.getId().equals(userId)).isPresent()) {
                throw new AuthException("Email already in use", HttpStatus.CONFLICT);
            }
            user.setEmail(email);
        }
        if (team != null) user.setTeam(team);

        User saved = userRepository.save(user);
        return UserDto.fromEntity(saved);
    }
}
