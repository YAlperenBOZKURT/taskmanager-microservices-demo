/**
 * User repository - Spring Data JPA handles the query generation
 * @author Yusuf Alperen Bozkurt
 */
package com.taskmanager.auth.repository;

import com.taskmanager.auth.entity.Role;
import com.taskmanager.auth.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    Page<User> findByRolesContaining(Role role, Pageable pageable);

    @Query("SELECT u FROM User u JOIN u.teams t WHERE t = :team")
    Page<User> findByTeam(@Param("team") String team, Pageable pageable);

    @Query("SELECT u FROM User u JOIN u.teams t WHERE t = :team")
    List<User> findByTeam(@Param("team") String team);

    @Query("SELECT DISTINCT t FROM User u JOIN u.teams t ORDER BY t")
    List<String> findAllDistinctTeams();
}
