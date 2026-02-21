package com.example.frly.section.dto;

import lombok.Data;
import java.time.Instant;

@Data
public class NoteDto {
    private Long id;
    private Long sectionId;
    private String content;
    private Integer version;
    private Instant lastEditedAt;
    private String lastEditedByName;
}
