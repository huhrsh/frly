package com.example.frly.section.dto;

import lombok.Data;

@Data
public class UpdateNoteRequestDto {
    private String content;
    private Integer version;
}
