package com.taskmanager.auth.service;

import com.taskmanager.auth.dto.ChangePasswordDto;
import com.taskmanager.auth.dto.UserDto;
import com.taskmanager.auth.entity.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Set;
import java.util.UUID;

public interface IUserService {

    UserDto getCurrentUser(String username);

    Page<UserDto> getAllUsers(Pageable pageable);

    UserDto getUserById(UUID userId);

    void changePassword(String username, ChangePasswordDto dto);

    UserDto toggleUserStatus(UUID userId, boolean enabled);

    UserDto assignRoles(UUID userId, Set<Role> roles);

    void deleteUser(UUID userId);

    UserDto addUserToTeam(UUID userId, String team);

    UserDto removeUserFromTeam(UUID userId, String team);

    UserDto setUserTeams(UUID userId, Set<String> teams);

    Page<UserDto> getUsersByTeam(String team, Pageable pageable);

    List<String> getAllTeams();

    UserDto updateUserProfile(UUID userId, String fullName, String email);
}
