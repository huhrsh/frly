package com.example.frly.section.dto;

import lombok.Data;

@Data
public class LinkDto {
    private Long id;
    private Long sectionId;
    private String key;
    private String url;
    private String description;
    private Integer position;
}
