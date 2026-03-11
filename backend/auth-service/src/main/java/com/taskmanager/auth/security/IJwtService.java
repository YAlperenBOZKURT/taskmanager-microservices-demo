package com.taskmanager.auth.security;

import org.springframework.security.core.userdetails.UserDetails;

import java.util.Set;
import java.util.UUID;

public interface IJwtService {

    String generateAccessToken(UserDetails userDetails, UUID userId, Set<String> teams);

    String generateRefreshToken(UserDetails userDetails);

    String extractUsername(String token);

    UUID extractUserId(String token);

    boolean isTokenValid(String token, UserDetails userDetails);

    long getAccessTokenExpiration();
}
