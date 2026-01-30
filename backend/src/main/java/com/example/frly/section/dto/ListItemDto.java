package com.example.frly.section.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ListItemDto {
    private Long id;
    private String text;
    private boolean isCompleted;
    private LocalDateTime dueDate;
    private Integer position;
}
