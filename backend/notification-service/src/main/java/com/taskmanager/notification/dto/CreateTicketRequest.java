/**
 * Request body for creating a new support ticket
 * @author Yusuf Alperen Bozkurt
 */
package com.taskmanager.notification.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTicketRequest {

    @NotBlank(message = "Recipient ID is required")
    private String recipientId;

    private String recipientRole;

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Content is required")
    private String content;
}
