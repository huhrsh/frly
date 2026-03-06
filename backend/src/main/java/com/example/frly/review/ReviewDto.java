package com.example.frly.review;

import lombok.*;
import java.time.Instant;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ReviewDto {
    private Long id;
    private Long userId;
    private String message;
    private int rating;
    private boolean showPublicly;
    private Instant createdAt;
}
