package com.example.frly.section.dto;

import com.example.frly.section.model.SectionType;
import lombok.Data;

@Data
public class CreateSectionRequestDto {
    private String title;
    private SectionType type;
    private Long parentId; // Optional, for nested sections
    // Section-level passwords removed; only title/type/parent are used.
}
