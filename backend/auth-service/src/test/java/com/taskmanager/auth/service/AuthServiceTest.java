package com.taskmanager.auth.service;

import com.taskmanager.auth.dto.*;
import com.taskmanager.auth.entity.Role;
import com.taskmanager.auth.entity.User;
import com.taskmanager.auth.exception.AuthException;
import com.taskmanager.auth.repository.UserRepository;
import com.taskmanager.auth.security.IJwtService;
import com.taskmanager.auth.security.ITokenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private IJwtService jwtService;
    @Mock private ITokenService tokenService;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private UserDetailsService userDetailsService;
    @Mock private KafkaTemplate<String, Object> kafkaTemplate;

    @InjectMocks
    private AuthService authService;

    private User testUser;
    private RegisterRequest registerRequest;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(UUID.randomUUID())
                .username("testuser")
                .email("test@example.com")
                .password("encodedPassword")
                .fullName("Test User")
                .roles(new HashSet<>(Set.of(Role.ROLE_USER)))
                .teams(new HashSet<>(Set.of("team-a")))
                .enabled(true)
                .locked(false)
                .failedLoginAttempts(0)
                .build();

        registerRequest = new RegisterRequest();
        registerRequest.setUsername("newuser");
        registerRequest.setEmail("new@example.com");
        registerRequest.setPassword("password123");
        registerRequest.setFullName("New User");
    }

    @Test
    void register_success() {
        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encodedPwd");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });
        when(kafkaTemplate.send(anyString(), any())).thenReturn(null);

        UserDto result = authService.register(registerRequest);

        assertNotNull(result);
        assertEquals("newuser", result.getUsername());
        verify(userRepository).save(any(User.class));
        verify(kafkaTemplate).send(eq("user-registered"), any());
    }

    @Test
    void register_duplicateUsername_throwsConflict() {
        when(userRepository.existsByUsername("newuser")).thenReturn(true);

        AuthException ex = assertThrows(AuthException.class, () -> authService.register(registerRequest));
        assertTrue(ex.getMessage().contains("Username already exists"));
    }

    @Test
    void register_duplicateEmail_throwsConflict() {
        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(userRepository.existsByEmail("new@example.com")).thenReturn(true);

        AuthException ex = assertThrows(AuthException.class, () -> authService.register(registerRequest));
        assertTrue(ex.getMessage().contains("Email already exists"));
    }

    @Test
    void login_success() {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("password123");

        UserDetails userDetails = mock(UserDetails.class);
        UsernamePasswordAuthenticationToken authToken =
                new UsernamePasswordAuthenticationToken(userDetails, null, List.of());

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(authenticationManager.authenticate(any())).thenReturn(authToken);
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        when(jwtService.generateAccessToken(any(), any(), any())).thenReturn("access-token");
        when(jwtService.generateRefreshToken(any())).thenReturn("refresh-token");
        when(jwtService.getAccessTokenExpiration()).thenReturn(3600L);

        AuthResponse response = authService.login(loginRequest);

        assertNotNull(response);
        assertEquals("access-token", response.getAccessToken());
        assertEquals("refresh-token", response.getRefreshToken());
        verify(tokenService).storeRefreshToken(testUser.getId(), "refresh-token");
    }

    @Test
    void login_lockedAccount_throwsLocked() {
        testUser.setLocked(true);
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("password123");

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));

        AuthException ex = assertThrows(AuthException.class, () -> authService.login(loginRequest));
        assertTrue(ex.getMessage().contains("locked"));
    }

    @Test
    void login_badCredentials_incrementsFailedAttempts() {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("wrong");

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("Bad credentials"));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        assertThrows(BadCredentialsException.class, () -> authService.login(loginRequest));
        assertEquals(1, testUser.getFailedLoginAttempts());
    }

    @Test
    void login_fifthFailedAttempt_locksAccount() {
        testUser.setFailedLoginAttempts(4);
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("wrong");

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("Bad credentials"));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        assertThrows(BadCredentialsException.class, () -> authService.login(loginRequest));
        assertTrue(testUser.isLocked());
    }

    @Test
    void logout_success() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(jwtService.getAccessTokenExpiration()).thenReturn(3600L);

        authService.logout("some-token", "testuser");

        verify(tokenService).removeRefreshToken(testUser.getId());
        verify(tokenService).blacklistAccessToken("some-token", 3600L);
    }
}
