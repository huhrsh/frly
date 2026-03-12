package com.example.frly.section.dto;

import lombok.Data;

@Data
public class UpdateLinkRequestDto {
    private String key;
    private String url;
    private String description;
}
