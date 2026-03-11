package com.taskmanager.auth.service;

import com.taskmanager.auth.dto.ChangePasswordDto;
import com.taskmanager.auth.dto.UserDto;
import com.taskmanager.auth.entity.Role;
import com.taskmanager.auth.entity.User;
import com.taskmanager.auth.exception.AuthException;
import com.taskmanager.auth.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private User testUser;
    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        testUser = User.builder()
                .id(userId)
                .username("testuser")
                .email("test@example.com")
                .password("encodedPassword")
                .fullName("Test User")
                .roles(new HashSet<>(Set.of(Role.ROLE_USER)))
                .teams(new HashSet<>(Set.of("team-a")))
                .enabled(true)
                .build();
    }

    @Test
    void getCurrentUser_success() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));

        UserDto result = userService.getCurrentUser("testuser");

        assertEquals("testuser", result.getUsername());
        assertEquals("test@example.com", result.getEmail());
    }

    @Test
    void getCurrentUser_notFound_throws() {
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        assertThrows(AuthException.class, () -> userService.getCurrentUser("ghost"));
    }

    @Test
    void getAllUsers_returnsPaginated() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<User> page = new PageImpl<>(List.of(testUser), pageable, 1);
        when(userRepository.findAll(pageable)).thenReturn(page);

        Page<UserDto> result = userService.getAllUsers(pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals("testuser", result.getContent().get(0).getUsername());
    }

    @Test
    void getUserById_success() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

        UserDto result = userService.getUserById(userId);

        assertEquals(userId, result.getId());
    }

    @Test
    void getUserById_notFound_throws() {
        UUID randomId = UUID.randomUUID();
        when(userRepository.findById(randomId)).thenReturn(Optional.empty());

        assertThrows(AuthException.class, () -> userService.getUserById(randomId));
    }

    @Test
    void changePassword_success() {
        ChangePasswordDto dto = new ChangePasswordDto();
        dto.setCurrentPassword("oldPass");
        dto.setNewPassword("newPass123");

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("oldPass", "encodedPassword")).thenReturn(true);
        when(passwordEncoder.encode("newPass123")).thenReturn("newEncodedPass");

        userService.changePassword("testuser", dto);

        verify(userRepository).save(testUser);
        assertEquals("newEncodedPass", testUser.getPassword());
    }

    @Test
    void changePassword_wrongCurrentPassword_throws() {
        ChangePasswordDto dto = new ChangePasswordDto();
        dto.setCurrentPassword("wrongPass");
        dto.setNewPassword("newPass123");

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("wrongPass", "encodedPassword")).thenReturn(false);

        assertThrows(AuthException.class, () -> userService.changePassword("testuser", dto));
    }

    @Test
    void toggleUserStatus_disablesUser() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        userService.toggleUserStatus(userId, false);

        assertFalse(testUser.isEnabled());
        assertFalse(testUser.isLocked());
        assertEquals(0, testUser.getFailedLoginAttempts());
    }

    @Test
    void assignRoles_success() {
        Set<Role> newRoles = Set.of(Role.ROLE_ADMIN);
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        userService.assignRoles(userId, newRoles);

        assertEquals(newRoles, testUser.getRoles());
    }

    @Test
    void deleteUser_success() {
        when(userRepository.existsById(userId)).thenReturn(true);

        userService.deleteUser(userId);

        verify(userRepository).deleteById(userId);
    }

    @Test
    void deleteUser_notFound_throws() {
        UUID randomId = UUID.randomUUID();
        when(userRepository.existsById(randomId)).thenReturn(false);

        assertThrows(AuthException.class, () -> userService.deleteUser(randomId));
    }

    @Test
    void addUserToTeam_success() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        userService.addUserToTeam(userId, "team-b");

        assertTrue(testUser.getTeams().contains("team-b"));
    }

    @Test
    void removeUserFromTeam_success() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        userService.removeUserFromTeam(userId, "team-a");

        assertFalse(testUser.getTeams().contains("team-a"));
    }

    @Test
    void updateUserProfile_success() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        userService.updateUserProfile(userId, "New Name", null);

        assertEquals("New Name", testUser.getFullName());
    }

    @Test
    void updateUserProfile_duplicateEmail_throws() {
        User otherUser = User.builder().id(UUID.randomUUID()).email("taken@example.com").build();
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(userRepository.findByEmail("taken@example.com")).thenReturn(Optional.of(otherUser));

        assertThrows(AuthException.class, () ->
                userService.updateUserProfile(userId, null, "taken@example.com"));
    }
}
