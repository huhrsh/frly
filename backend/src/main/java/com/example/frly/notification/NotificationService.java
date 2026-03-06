package com.example.frly.notification;

import com.example.frly.auth.AuthUtil;
import com.example.frly.user.User;
import com.example.frly.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional
    public void notifyUser(Long userId, String type, String message) {
        User user = userRepository.getReferenceById(userId);
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setType(type);
        notification.setMessage(message);
        notificationRepository.save(notification);
        log.info("Notification created for user {} of type {}", userId, type);
    }

    @Transactional(readOnly = true)
    public Page<NotificationDto> getCurrentUserNotifications(Pageable pageable) {
        Long userId = AuthUtil.getCurrentUserId();
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::toDto);
    }

    @Transactional(readOnly = true)
    public long getCurrentUserUnreadCount() {
        Long userId = AuthUtil.getCurrentUserId();
        return notificationRepository.countByUserIdAndReadIsFalse(userId);
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        Long userId = AuthUtil.getCurrentUserId();
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    private NotificationDto toDto(Notification notification) {
        NotificationDto dto = new NotificationDto();
        dto.setId(notification.getId());
        dto.setType(notification.getType());
        dto.setMessage(notification.getMessage());
        dto.setRead(notification.isRead());
        dto.setCreatedAt(notification.getCreatedAt());
        return dto;
    }

    @Transactional
    public void markAllAsReadForCurrentUser() {
        Long userId = AuthUtil.getCurrentUserId();
        notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .forEach(n -> {
                    if (!n.isRead()) {
                        n.setRead(true);
                    }
                });
    }
}
