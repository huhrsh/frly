package com.example.frly.section.dto;

import lombok.Data;

@Data
public class UpdateSectionSecurityRequestDto {
    private boolean secured;
    private String password;
}
