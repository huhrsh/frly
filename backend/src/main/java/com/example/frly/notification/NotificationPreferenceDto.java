package com.example.frly.notification;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPreferenceDto {
    private boolean inAppEnabled;
    private boolean pushEnabled;
    
    // Map of section type to notification mode (BOTH, IN_APP_ONLY, PUSH_ONLY, NONE)
    private Map<String, String> sectionPreferences;
    
    // Constructor for backward compatibility
    public NotificationPreferenceDto(boolean inAppEnabled, boolean pushEnabled) {
        this.inAppEnabled = inAppEnabled;
        this.pushEnabled = pushEnabled;
        this.sectionPreferences = new HashMap<>();
        // Default: BOTH for critical types, IN_APP_ONLY for others
        sectionPreferences.put("NOTE", "IN_APP_ONLY");
        sectionPreferences.put("LIST", "BOTH");
        sectionPreferences.put("LINKS", "IN_APP_ONLY");
        sectionPreferences.put("GALLERY", "IN_APP_ONLY");
        sectionPreferences.put("REMINDER", "BOTH");
        sectionPreferences.put("PAYMENT", "BOTH");
        sectionPreferences.put("CALENDAR", "BOTH");
        sectionPreferences.put("FOLDER", "IN_APP_ONLY");
    }
}
