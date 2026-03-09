/**
 * Request body for creating a new support ticket
 * @author Yusuf Alperen Bozkurt
 */
package com.taskmanager.notification.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTicketRequest {

    @NotEmpty(message = "At least one receiver is required")
    private List<String> receiverIds;

    private List<String> teamIds;

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Message is required")
    private String message;
}
