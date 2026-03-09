/**
 * Redis-based token storage - handles refresh tokens and blacklisting access tokens
 */
package com.taskmanager.auth.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class TokenService {

    private static final String REFRESH_TOKEN_PREFIX = "refresh_token:";
    private static final String BLACKLIST_PREFIX = "blacklist:";

    private final RedisTemplate<String, Object> redisTemplate;

    @Value("${jwt.refresh-token-expiration}")
    private long refreshTokenExpiration;

    public void storeRefreshToken(UUID userId, String refreshToken) {
        String key = REFRESH_TOKEN_PREFIX + userId;
        redisTemplate.opsForValue().set(key, refreshToken, refreshTokenExpiration, TimeUnit.MILLISECONDS);
        log.info("Refresh token stored in Redis for userId: {}", userId);
    }

    public String getStoredRefreshToken(UUID userId) {
        String key = REFRESH_TOKEN_PREFIX + userId;
        Object token = redisTemplate.opsForValue().get(key);
        return token != null ? token.toString() : null;
    }

    public boolean validateRefreshToken(UUID userId, String refreshToken) {
        String storedToken = getStoredRefreshToken(userId);
        if (storedToken == null) {
            log.info("No refresh token found in Redis for userId: {}", userId);
            return false;
        }
        boolean valid = storedToken.equals(refreshToken);
        if (!valid) {
            log.info("Refresh token mismatch for userId: {}", userId);
        }
        return valid;
    }

    public void removeRefreshToken(UUID userId) {
        String key = REFRESH_TOKEN_PREFIX + userId;
        redisTemplate.delete(key);
        log.info("Refresh token removed from Redis for userId: {}", userId);
    }

    public void blacklistAccessToken(String accessToken, long expirationMs) {
        // store in redis with TTL so it auto-cleans after the token would expire anyway
        String key = BLACKLIST_PREFIX + accessToken;
        redisTemplate.opsForValue().set(key, "blacklisted", expirationMs, TimeUnit.MILLISECONDS);
        log.info("Access token blacklisted");
    }

    public boolean isAccessTokenBlacklisted(String accessToken) {
        String key = BLACKLIST_PREFIX + accessToken;
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }
}
