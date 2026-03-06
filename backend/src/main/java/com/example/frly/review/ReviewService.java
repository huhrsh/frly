package com.example.frly.review;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {
    private final ReviewRepository reviewRepository;

    public ReviewDto saveReview(Long userId, String message, int rating, boolean showPublicly) {
        Review review = Review.builder()
                .userId(userId)
                .message(message)
                .rating(rating)
                .showPublicly(showPublicly)
                .createdAt(Instant.now())
                .build();
        Review saved = reviewRepository.save(review);
        return toDto(saved);
    }

    public List<ReviewDto> getPublicReviews() {
        return reviewRepository.findByShowPubliclyTrueOrderByCreatedAtDesc()
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    private ReviewDto toDto(Review r) {
        return ReviewDto.builder()
                .id(r.getId())
                .userId(r.getUserId())
                .message(r.getMessage())
                .rating(r.getRating())
                .showPublicly(r.isShowPublicly())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
