package com.example.frly.review;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "review", schema = "config")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Review {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private String message;
    private int rating; // 1-5
    private boolean showPublicly;
    private Instant createdAt;
}
