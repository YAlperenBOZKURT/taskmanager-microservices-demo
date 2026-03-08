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
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Slf4j
public class GatewayHeaderAuthFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // these headers are set by the api gateway after JWT validation
        String userId = request.getHeader("X-User-Id");
        String username = request.getHeader("X-Username");
        String roles = request.getHeader("X-User-Roles");

        if (userId != null && username != null) {
            List<SimpleGrantedAuthority> authorities = Collections.emptyList();
            // roles come as comma-separated string like "ROLE_ADMIN,ROLE_USER"
            if (roles != null && !roles.isBlank()) {
                authorities = Arrays.stream(roles.split(","))
                        .map(String::trim)
                        .map(SimpleGrantedAuthority::new)
                        .toList();
            }

            // store userId in credentials so controllers can easily grab it
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(username, userId, authorities);

            SecurityContextHolder.getContext().setAuthentication(authentication);
            log.debug("Gateway auth set - user: {}, userId: {}, roles: {}", username, userId, roles);
        }

        filterChain.doFilter(request, response);
    }
}
