package com.example.frly.section.dto;

import com.example.frly.section.model.SectionType;
import lombok.Data;

@Data
public class SectionDto {
    private Long id;
    private String title;
    private SectionType type;
    private Integer position;
    private Long parentId;
    // Section-level passwords removed; this flag is deprecated and no longer sent.
}
