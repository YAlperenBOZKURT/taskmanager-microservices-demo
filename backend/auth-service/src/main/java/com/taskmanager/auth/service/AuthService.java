/**
 * Handles all the core auth stuff - registration, login, token refresh, logout
 */
package com.taskmanager.auth.service;

import com.taskmanager.auth.config.KafkaConfig;
import com.taskmanager.auth.dto.*;
import com.taskmanager.auth.entity.Role;
import com.taskmanager.auth.entity.User;
import com.taskmanager.auth.exception.AuthException;
import com.taskmanager.auth.repository.UserRepository;
import com.taskmanager.auth.security.IJwtService;
import com.taskmanager.auth.security.ITokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Map;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService implements IAuthService {

    // lock the account after too many failed attempts
    private static final int MAX_FAILED_ATTEMPTS = 5;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final IJwtService jwtService;
    private final ITokenService tokenService;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Transactional
    public UserDto register(RegisterRequest request) {
        log.info("Registering new user: {}", request.getUsername());

        if (userRepository.existsByUsername(request.getUsername())) {
            log.error("Registration failed - username already exists: {}", request.getUsername());
            throw new AuthException("Username already exists", HttpStatus.CONFLICT);
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            log.error("Registration failed - email already exists: {}", request.getEmail());
            throw new AuthException("Email already exists", HttpStatus.CONFLICT);
        }

        // default to regular user role if none specified
        Set<Role> roles = (request.getRoles() != null && !request.getRoles().isEmpty())
                ? request.getRoles()
                : Set.of(Role.ROLE_USER);

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .teams(request.getTeams() != null ? new HashSet<>(request.getTeams()) : new HashSet<>())
                .roles(new HashSet<>(roles))
                .enabled(true)
                .build();

        User savedUser = userRepository.save(user);
        log.info("User registered successfully: {} with roles: {}", savedUser.getUsername(), roles);

        // send event to kafka so notification service picks it up
        kafkaTemplate.send(KafkaConfig.USER_REGISTERED_TOPIC, Map.of(
                "userId", savedUser.getId().toString(),
                "username", savedUser.getUsername(),
                "email", savedUser.getEmail(),
                "fullName", savedUser.getFullName() != null ? savedUser.getFullName() : ""
        ));
        log.info("User registered event published to Kafka for user: {}", savedUser.getUsername());

        return UserDto.fromEntity(savedUser);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        log.info("Login attempt for user: {}", request.getUsername());

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> {
                    log.error("Login failed - user not found: {}", request.getUsername());
                    return new BadCredentialsException("Invalid username or password");
                });

        if (user.isLocked()) {
            log.error("Login failed - account is locked: {}", request.getUsername());
            throw new AuthException("Account is locked due to too many failed attempts. Contact an admin.", HttpStatus.LOCKED);
        }

        try {
            // spring security does the password check here
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

            // reset failed attempts on successful login
            user.setFailedLoginAttempts(0);
            userRepository.save(user);

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String accessToken = jwtService.generateAccessToken(userDetails, user.getId(), user.getTeams());
            String refreshToken = jwtService.generateRefreshToken(userDetails);

            // store refresh token in redis for later validation
            tokenService.storeRefreshToken(user.getId(), refreshToken);

            log.info("User logged in successfully: {}", request.getUsername());

            return AuthResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .tokenType("Bearer")
                    .expiresIn(jwtService.getAccessTokenExpiration())
                    .user(UserDto.fromEntity(user))
                    .build();

        } catch (BadCredentialsException e) {
            // track failed attempts and lock if too many
            user.setFailedLoginAttempts(user.getFailedLoginAttempts() + 1);
            if (user.getFailedLoginAttempts() >= MAX_FAILED_ATTEMPTS) {
                user.setLocked(true);
                log.error("Account locked after {} failed attempts: {}", MAX_FAILED_ATTEMPTS, request.getUsername());
            }
            userRepository.save(user);
            log.error("Login failed - invalid credentials for user: {} (attempt {})",
                    request.getUsername(), user.getFailedLoginAttempts());
            throw e;
        }
    }

    public AuthResponse refreshToken(String refreshToken) {
        log.info("Token refresh requested");

        String username;
        try {
            username = jwtService.extractUsername(refreshToken);
        } catch (Exception e) {
            log.error("Refresh token parsing failed: {}", e.getMessage());
            throw new AuthException("Invalid refresh token", HttpStatus.UNAUTHORIZED);
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    log.error("Refresh failed - user not found: {}", username);
                    return new AuthException("User not found", HttpStatus.UNAUTHORIZED);
                });

        if (!tokenService.validateRefreshToken(user.getId(), refreshToken)) {
            log.error("Refresh token validation failed for user: {}", username);
            throw new AuthException("Invalid or expired refresh token", HttpStatus.UNAUTHORIZED);
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        if (!jwtService.isTokenValid(refreshToken, userDetails)) {
            log.error("Refresh token JWT validation failed for user: {}", username);
            tokenService.removeRefreshToken(user.getId());
            throw new AuthException("Refresh token expired", HttpStatus.UNAUTHORIZED);
        }

        String newAccessToken = jwtService.generateAccessToken(userDetails, user.getId(), user.getTeams());
        String newRefreshToken = jwtService.generateRefreshToken(userDetails);

        tokenService.storeRefreshToken(user.getId(), newRefreshToken);

        log.info("Tokens refreshed successfully for user: {}", username);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtService.getAccessTokenExpiration())
                .user(UserDto.fromEntity(user))
                .build();
    }

    public void logout(String accessToken, String username) {
        log.info("Logout requested for user: {}", username);

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AuthException("User not found", HttpStatus.NOT_FOUND));

        // invalidate both tokens - blacklist access token and remove refresh from redis
        tokenService.removeRefreshToken(user.getId());
        tokenService.blacklistAccessToken(accessToken, jwtService.getAccessTokenExpiration());

        log.info("User logged out successfully: {}", username);
    }
}
