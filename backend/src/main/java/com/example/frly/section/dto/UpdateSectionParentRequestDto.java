package com.example.frly.section.dto;

import lombok.Data;

@Data
public class UpdateSectionParentRequestDto {

    /**
     * New parent section id. When null, the section is moved to the root level.
     */
    private Long parentId;
}
