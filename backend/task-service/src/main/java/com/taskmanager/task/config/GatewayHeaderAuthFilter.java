/**
 * Reads user info (id, username, roles) from headers that the API gateway
 * sets after validating the JWT. This way we don't need to validate tokens here.
 * @author Yusuf Alperen Bozkurt
 */
package com.taskmanager.task.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.*;

@Slf4j
public class GatewayHeaderAuthFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String userId = request.getHeader("X-User-Id");
        String username = request.getHeader("X-Username");
        String roles = request.getHeader("X-User-Roles");
        String teams = request.getHeader("X-User-Teams");

        if (userId != null && username != null) {
            List<SimpleGrantedAuthority> authorities = Collections.emptyList();
            if (roles != null && !roles.isBlank()) {
                authorities = Arrays.stream(roles.split(","))
                        .map(String::trim)
                        .map(SimpleGrantedAuthority::new)
                        .toList();
            }

            Map<String, Object> details = new HashMap<>();
            details.put("userId", userId);
            if (teams != null && !teams.isBlank()) {
                details.put("teams", Arrays.stream(teams.split(","))
                        .map(String::trim)
                        .filter(t -> !t.isEmpty())
                        .collect(java.util.stream.Collectors.toSet()));
            } else {
                details.put("teams", Collections.emptySet());
            }

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(username, userId, authorities);
            authentication.setDetails(details);

            SecurityContextHolder.getContext().setAuthentication(authentication);
            log.debug("Gateway auth set - user: {}, userId: {}, roles: {}, teams: {}", username, userId, roles, teams);
        }

        filterChain.doFilter(request, response);
    }
}
