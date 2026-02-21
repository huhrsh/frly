package com.example.frly.section.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ReminderDto {
    private Long id;
    private String title;
    private String description;
    private LocalDateTime triggerTime;
    private Boolean isSent;
    private boolean notify;
    private String frequency;
}
