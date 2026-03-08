/**
 * Event model for user-related kafka messages from auth-service
 * @author Yusuf Alperen Bozkurt
 */
package com.taskmanager.notification.event;

import lombok.*;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserEvent {

    private String userId;
    private String username;
    private String email;
    private String fullName;

    // kafka deserializes user events as raw maps, so we parse them here
    @SuppressWarnings("unchecked")
    public static UserEvent fromMap(Map<String, Object> map) {
        return UserEvent.builder()
                .userId(getStr(map, "userId"))
                .username(getStr(map, "username"))
                .email(getStr(map, "email"))
                .fullName(getStr(map, "fullName"))
                .build();
    }

    private static String getStr(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val != null ? val.toString() : null;
    }
}
