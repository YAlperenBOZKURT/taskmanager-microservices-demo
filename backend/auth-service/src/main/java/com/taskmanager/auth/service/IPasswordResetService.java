package com.taskmanager.auth.service;

import com.taskmanager.auth.dto.PasswordResetConfirmDto;
import com.taskmanager.auth.dto.PasswordResetRequestDto;

public interface IPasswordResetService {

    String requestPasswordReset(PasswordResetRequestDto dto);

    void confirmPasswordReset(PasswordResetConfirmDto dto);
}
