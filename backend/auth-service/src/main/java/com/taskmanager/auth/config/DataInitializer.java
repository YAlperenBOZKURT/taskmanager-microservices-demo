/**
 * Creates/updates default users on startup for testing.
 * Ensures teams and users exist with correct roles.
 * @author Yusuf Alperen Bozkurt
 */
package com.taskmanager.auth.config;

import com.taskmanager.auth.entity.Role;
import com.taskmanager.auth.entity.User;
import com.taskmanager.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        log.info("Running data initialization...");

        createOrUpdateUser("superadmin1", "superadmin1@taskmanager.com", "SuperAdmin123!",
                "Super Admin 1", Set.of(Role.ROLE_SUPER_ADMIN), new HashSet<>());
        createOrUpdateUser("superadmin2", "superadmin2@taskmanager.com", "SuperAdmin123!",
                "Super Admin 2", Set.of(Role.ROLE_SUPER_ADMIN), new HashSet<>());
        createOrUpdateUser("superadmin3", "superadmin3@taskmanager.com", "SuperAdmin123!",
                "Super Admin 3", Set.of(Role.ROLE_SUPER_ADMIN), new HashSet<>());

        createOrUpdateUser("admin1", "admin1@taskmanager.com", "Admin123!",
                "Admin 1", Set.of(Role.ROLE_ADMIN), new HashSet<>(Set.of("Team A", "Team C")));
        createOrUpdateUser("admin2", "admin2@taskmanager.com", "Admin123!",
                "Admin 2", Set.of(Role.ROLE_ADMIN), new HashSet<>(Set.of("Team B", "Team C")));
        createOrUpdateUser("admin3", "admin3@taskmanager.com", "Admin123!",
                "Admin 3", Set.of(Role.ROLE_ADMIN), new HashSet<>(Set.of("Team A", "Team B")));

        createOrUpdateUser("user1", "user1@taskmanager.com", "User123!",
                "User 1", Set.of(Role.ROLE_USER), new HashSet<>(Set.of("Team A", "Team C")));
        createOrUpdateUser("user2", "user2@taskmanager.com", "User123!",
                "User 2", Set.of(Role.ROLE_USER), new HashSet<>(Set.of("Team B", "Team C")));
        createOrUpdateUser("user3", "user3@taskmanager.com", "User123!",
                "User 3", Set.of(Role.ROLE_USER), new HashSet<>(Set.of("Team A", "Team B")));

        log.info("Data initialization complete.");
        log.info("  SUPER_ADMINS: superadmin1, superadmin2, superadmin3 (password: SuperAdmin123!)");
        log.info("  ADMINS:       admin1 (A,C), admin2 (B,C), admin3 (A,B) (password: Admin123!)");
        log.info("  USERS:        user1 (A,C), user2 (B,C), user3 (A,B) (password: User123!)");
    }

    private void createOrUpdateUser(String username, String email, String password,
                                     String fullName, Set<Role> roles, Set<String> teams) {
        Optional<User> existing = userRepository.findByUsername(username);

        if (existing.isPresent()) {
            User user = existing.get();
            user.setRoles(new HashSet<>(roles));
            user.setTeams(teams);
            user.setFullName(fullName);
            user.setEmail(email);
            user.setEnabled(true);
            user.setLocked(false);
            user.setFailedLoginAttempts(0);
            userRepository.save(user);
            log.info("Updated existing user: {} with roles={}, teams={}", username, roles, teams);
        } else {
            User user = User.builder()
                    .username(username)
                    .email(email)
                    .password(passwordEncoder.encode(password))
                    .fullName(fullName)
                    .roles(new HashSet<>(roles))
                    .teams(teams)
                    .enabled(true)
                    .build();
            userRepository.save(user);
            log.info("Created new user: {} with roles={}, teams={}", username, roles, teams);
        }
    }
}
