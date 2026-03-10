package com.example.frly.feedback;

import lombok.*;
import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeedbackDto {
    private Long id;
    private Long userId;
    private Long groupId;
    private String message;
    private Instant createdAt;
}
