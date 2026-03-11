package com.taskmanager.auth.security;

import java.util.UUID;

public interface ITokenService {

    void storeRefreshToken(UUID userId, String refreshToken);

    String getStoredRefreshToken(UUID userId);

    boolean validateRefreshToken(UUID userId, String refreshToken);

    void removeRefreshToken(UUID userId);

    void blacklistAccessToken(String accessToken, long expirationMs);

    boolean isAccessTokenBlacklisted(String accessToken);
}
