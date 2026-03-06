package com.example.frly.feedback;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.Instant;

@Service
@RequiredArgsConstructor
public class FeedbackService {
    private final FeedbackRepository feedbackRepository;

    public FeedbackDto saveFeedback(Long userId, Long groupId, String message) {
        Feedback feedback = Feedback.builder()
                .userId(userId)
                .groupId(groupId)
                .message(message)
                .createdAt(Instant.now())
                .build();
        Feedback saved = feedbackRepository.save(feedback);
        return FeedbackDto.builder()
                .id(saved.getId())
                .userId(saved.getUserId())
                .groupId(saved.getGroupId())
                .message(saved.getMessage())
                .createdAt(saved.getCreatedAt())
                .build();
    }
}
