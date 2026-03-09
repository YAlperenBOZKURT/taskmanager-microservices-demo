/**
 * DTO for submitting a profile change approval request
 */
package com.taskmanager.auth.dto;

import jakarta.validation.constraints.Email;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalRequestDto {

    private String requestedFullName;

    @Email(message = "Email must be valid")
    private String requestedEmail;

    private String reason;
}
