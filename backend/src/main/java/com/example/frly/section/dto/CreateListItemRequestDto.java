package com.example.frly.section.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CreateListItemRequestDto {
    private String text;
    private LocalDateTime dueDate;
}
