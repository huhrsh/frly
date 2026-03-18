package com.example.frly.section.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UpdateListItemRequestDto {
    private String text;
    private LocalDateTime dueDate;
}
