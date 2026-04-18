package com.example.frly.notification;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class NotificationRequest {
    private Long userId;
    private String type;
    private String title;
    private String message;
    private Long groupId;
    private Long sectionId;
    private String actorName;
    private String actorPfpUrl;
    private String sectionType; // NOTE, LIST, LINKS, GALLERY, REMINDER, PAYMENT, CALENDAR, FOLDER
    
    // Constructor for backward compatibility (without sectionType)
    public NotificationRequest(Long userId, String type, String title, String message, 
                              Long groupId, Long sectionId, String actorName) {
        this.userId = userId;
        this.type = type;
        this.title = title;
        this.message = message;
        this.groupId = groupId;
        this.sectionId = sectionId;
        this.actorName = actorName;
        this.sectionType = null;
    }
}

