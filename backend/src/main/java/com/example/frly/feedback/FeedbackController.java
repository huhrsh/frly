package com.example.frly.feedback;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
public class FeedbackController {
    private final FeedbackService feedbackService;

    @PostMapping
    public ResponseEntity<FeedbackDto> submitFeedback(@RequestBody FeedbackDto dto) {
        Long userId = com.example.frly.auth.AuthUtil.getCurrentUserId();
        FeedbackDto saved = feedbackService.saveFeedback(userId, dto.getGroupId(), dto.getMessage());
        return ResponseEntity.ok(saved);
    }
}
