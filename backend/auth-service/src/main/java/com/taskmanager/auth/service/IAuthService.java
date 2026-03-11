package com.taskmanager.auth.service;

import com.taskmanager.auth.dto.AuthResponse;
import com.taskmanager.auth.dto.LoginRequest;
import com.taskmanager.auth.dto.RegisterRequest;
import com.taskmanager.auth.dto.UserDto;

public interface IAuthService {

    UserDto register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    AuthResponse refreshToken(String refreshToken);

    void logout(String accessToken, String username);
}
