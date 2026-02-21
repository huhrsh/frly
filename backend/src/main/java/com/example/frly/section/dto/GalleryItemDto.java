package com.example.frly.section.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class GalleryItemDto {
    private Long id;
    private Long sectionId;
    private String title;
    private String description;
    private String originalFilename;
    private String url;
    private Long fileSize;
    private String contentType;
    private LocalDateTime createdAt;
}
