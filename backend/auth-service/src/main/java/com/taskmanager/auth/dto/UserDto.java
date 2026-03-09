/**
 * DTO for user data - keeps the password out of API responses
 * @author Yusuf Alperen Bozkurt
 */
package com.taskmanager.auth.dto;

import com.taskmanager.auth.entity.Role;
import com.taskmanager.auth.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {

    private UUID id;
    private String username;
    private String email;
    private String fullName;
    private Set<Role> roles;
    private Set<String> teams;
    private boolean enabled;
    private LocalDateTime createdAt;

    public static UserDto fromEntity(User user) {
        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .roles(user.getRoles())
                .teams(user.getTeams())
                .enabled(user.isEnabled())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
