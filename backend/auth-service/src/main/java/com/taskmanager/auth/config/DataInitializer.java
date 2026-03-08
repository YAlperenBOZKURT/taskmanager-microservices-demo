/**
 * Creates default users on first startup so we have something to test with
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

import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // only seed data if db is empty - dont overwrite existing users
        if (userRepository.count() == 0) {
            log.info("No users found - creating default users");

            User superAdmin = User.builder()
                    .username("superadmin")
                    .email("superadmin@taskmanager.com")
                    .password(passwordEncoder.encode("SuperAdmin123!"))
                    .fullName("Super Administrator")
                    .roles(Set.of(Role.ROLE_SUPER_ADMIN, Role.ROLE_ADMIN))
                    .enabled(true)
                    .build();

            User admin = User.builder()
                    .username("admin")
                    .email("admin@taskmanager.com")
                    .password(passwordEncoder.encode("Admin123!"))
                    .fullName("Administrator")
                    .team("Backend Team")
                    .roles(Set.of(Role.ROLE_ADMIN))
                    .enabled(true)
                    .build();

            User user = User.builder()
                    .username("user")
                    .email("user@taskmanager.com")
                    .password(passwordEncoder.encode("User123!"))
                    .fullName("Standard User")
                    .team("Backend Team")
                    .roles(Set.of(Role.ROLE_USER))
                    .enabled(true)
                    .build();

            userRepository.save(superAdmin);
            userRepository.save(admin);
            userRepository.save(user);

            log.info("Default users created:");
            log.info("  SUPER_ADMIN - username: superadmin, password: SuperAdmin123!");
            log.info("  ADMIN       - username: admin, password: Admin123!");
            log.info("  USER        - username: user, password: User123!");
        } else {
            log.info("Users already exist - skipping data initialization");
        }
    }
}
