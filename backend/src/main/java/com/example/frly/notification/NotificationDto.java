package com.example.frly.notification;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class NotificationDto {
    private Long id;
    private String type;
    private String title;
    private String message;
    private String actorName;
    private Long actorId;
    private String actorPfpUrl;
    private Long groupId;
    private Long sectionId;
    private boolean read;
    private LocalDateTime createdAt;
}
