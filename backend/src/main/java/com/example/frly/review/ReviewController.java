package com.example.frly.review;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/review")
@RequiredArgsConstructor
public class ReviewController {
    private final ReviewService reviewService;

    @PostMapping
    public ResponseEntity<ReviewDto> submitReview(@RequestBody ReviewDto dto) {
        Long userId = com.example.frly.auth.AuthUtil.getCurrentUserId();
        ReviewDto saved = reviewService.saveReview(userId, dto.getMessage(), dto.getRating(), dto.isShowPublicly());
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/public")
    public ResponseEntity<List<ReviewDto>> getPublicReviews() {
        return ResponseEntity.ok(reviewService.getPublicReviews());
    }
}
