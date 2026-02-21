package com.example.frly.notification;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class NotificationDto {
    private Long id;
    private String type;
    private String message;
    private boolean read;
    private LocalDateTime createdAt;
}
