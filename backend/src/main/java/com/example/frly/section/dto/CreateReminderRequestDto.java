package com.example.frly.section.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CreateReminderRequestDto {
    private String title;
    private String description;
    private LocalDateTime triggerTime;
    private Boolean notify;
    private String frequency; // ONCE, DAILY, WEEKLY
}
