package com.example.frly.activity;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityLogService activityLogService;

    /**
     * Per-group activity log. Requires X-Group-ID header.
     * groupId path variable is used for the query directly (not via GroupContext).
     */
    @GetMapping("/api/groups/{groupId}/activity")
    public ResponseEntity<List<ActivityLogDto>> getGroupActivity(
            @PathVariable String groupId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(activityLogService.getGroupActivity(groupId, page, size));
    }

    /**
     * Cross-group recent activity for the current user, paginated.
     */
    @GetMapping("/api/activity/recent")
    public ResponseEntity<java.util.Map<String, Object>> getRecentActivity(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        List<ActivityLogDto> items = activityLogService.getRecentForCurrentUser(page, size);
        java.util.Map<String, Object> body = new java.util.LinkedHashMap<>();
        body.put("content", items);
        body.put("last", items.size() < size);
        return ResponseEntity.ok(body);
    }
}
