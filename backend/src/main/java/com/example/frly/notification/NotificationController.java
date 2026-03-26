package com.example.frly.notification;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final WebPushService webPushService;

    @GetMapping
    public ResponseEntity<Page<NotificationDto>> getMyNotifications(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(notificationService.getCurrentUserNotifications(pageable));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Long> getMyUnreadCount() {
        return ResponseEntity.ok(notificationService.getCurrentUserUnreadCount());
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/mark-all-read")
    public ResponseEntity<Void> markAllAsRead() {
        notificationService.markAllAsReadForCurrentUser();
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/push/public-key")
    public ResponseEntity<String> getPushPublicKey() {
        return ResponseEntity.ok(webPushService.getPublicKey());
    }
    
    @PostMapping("/push/subscribe")
    public ResponseEntity<Void> subscribeToPush(@RequestBody PushSubscriptionDto subscription) {
        notificationService.subscribeToPush(subscription);
        return ResponseEntity.ok().build();
    }
    
    @DeleteMapping("/push/unsubscribe")
    public ResponseEntity<Void> unsubscribeFromPush(@RequestParam String endpoint) {
        notificationService.unsubscribeFromPush(endpoint);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/preferences/{groupId}")
    public ResponseEntity<NotificationPreferenceDto> getNotificationPreferences(@PathVariable Long groupId) {
        return ResponseEntity.ok(notificationService.getPreferencesForGroup(groupId));
    }
    
    @PutMapping("/preferences/{groupId}")
    public ResponseEntity<Void> updateNotificationPreferences(
            @PathVariable Long groupId,
            @RequestBody NotificationPreferenceDto preferences
    ) {
        notificationService.updatePreferencesForGroup(groupId, preferences);
        return ResponseEntity.ok().build();
    }
}
