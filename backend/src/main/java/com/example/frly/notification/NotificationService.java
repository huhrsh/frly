package com.example.frly.notification;

import com.example.frly.auth.AuthUtil;
import com.example.frly.common.exception.BadRequestException;
import com.example.frly.group.enums.GroupMemberStatus;
import com.example.frly.group.model.Group;
import com.example.frly.group.model.GroupMember;
import com.example.frly.group.repository.GroupMemberRepository;
import com.example.frly.section.model.Section;
import com.example.frly.user.User;
import com.example.frly.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final PushSubscriptionRepository pushSubscriptionRepository;
    private final WebPushService webPushService;
    private final SectionNotificationPreferenceRepository sectionNotificationPreferenceRepository;
    
    // Critical notification types that trigger push notifications
    private static final List<String> PUSH_ENABLED_TYPES = List.of(
        NotificationType.PAYMENT_ADDED,
        NotificationType.PAYMENT_UPDATED,
        NotificationType.PAYMENT_DELETED,
        NotificationType.REMINDER_DUE,
        NotificationType.REMINDER_OVERDUE,
        NotificationType.GROUP_INVITE_RECEIVED,
        NotificationType.GROUP_JOIN_REQUEST,
        NotificationType.GROUP_JOIN_APPROVED,
        NotificationType.MEMBER_JOINED,
        NotificationType.FILE_UPLOADED,
        NotificationType.FILE_DELETED,
        NotificationType.GROUP_MEMBER_REMOVED,
        NotificationType.GROUP_MEMBER_LEFT
    );

    @Transactional
    public void notifyUser(NotificationRequest request) {
        if (request.getUserId() == null) {
            log.warn("notifyUser called with null userId");
            return;
        }
        
        // Check if section type notification mode allows in-app or push
        boolean allowInApp = true;
        boolean allowPush = true;
        
        if (request.getSectionType() != null && request.getGroupId() != null) {
            NotificationMode mode = getSectionNotificationMode(request.getUserId(), request.getGroupId(), request.getSectionType());
            
            if (mode == NotificationMode.NONE) {
                log.debug("Notifications disabled (mode: NONE) for section type {} for user {} in group {}", 
                    request.getSectionType(), request.getUserId(), request.getGroupId());
                return;
            }
            
            allowInApp = (mode == NotificationMode.BOTH || mode == NotificationMode.IN_APP_ONLY);
            allowPush = (mode == NotificationMode.BOTH || mode == NotificationMode.PUSH_ONLY);
        }
        
        // Create in-app notification if allowed
        if (allowInApp) {
            // Check if user has in-app notifications enabled for this group
            if (!isInAppNotificationEnabled(request.getUserId(), request.getGroupId())) {
                log.debug("In-app notifications disabled for user {} in group {}", request.getUserId(), request.getGroupId());
                allowInApp = false;
            }
            
            if (allowInApp) {
                User user = userRepository.getReferenceById(request.getUserId());
                Notification notification = new Notification();
                notification.setUser(user);
                notification.setType(request.getType());
                notification.setTitle(request.getTitle());
                notification.setMessage(request.getMessage());
                notification.setActorName(request.getActorName());
                if (request.getGroupId() != null) {
                    notification.setGroup(new Group());
                    notification.getGroup().setId(request.getGroupId());
                }
                if (request.getSectionId() != null) {
                    notification.setSection(new Section());
                    notification.getSection().setId(request.getSectionId());
                }
                notificationRepository.save(notification);
                log.info("Notification created for user {} of type {}", request.getUserId(), request.getType());
            }
        }
        
        // Send push notification if allowed and type is push-enabled
        if (allowPush && PUSH_ENABLED_TYPES.contains(request.getType()) && request.getTitle() != null) {
            if (isPushNotificationEnabled(request.getUserId(), request.getGroupId())) {
                String clickUrl = resolveClickUrl(request.getType(), request.getGroupId(), request.getSectionId());
                webPushService.sendPushNotification(request.getUserId(), request.getTitle(), request.getMessage(), clickUrl);
            } else {
                log.debug("Push notifications disabled for user {} in group {}", request.getUserId(), request.getGroupId());
            }
        }
    }

    // Overload for backward compatibility
    @Transactional
    public void notifyUser(Long userId, String type, String message) {
        notifyUser(new NotificationRequest(userId, type, null, message, null, null, null));
    }

    @Transactional
    public void notifyGroupMembers(Long groupId, Long sectionId, String type, String title, String message, String actorName, String sectionType) {
        Long currentUserId = AuthUtil.getCurrentUserId();
        List<Long> memberIds = groupMemberRepository
                .findByGroupIdAndStatus(groupId, GroupMemberStatus.APPROVED)
                .stream()
                .map(gm -> gm.getUser().getId())
                .filter(id -> !id.equals(currentUserId))
                .toList();
        
        int notifiedCount = 0;
        for (Long memberId : memberIds) {
            // Create notification request with section type
            NotificationRequest request = new NotificationRequest();
            request.setUserId(memberId);
            request.setType(type);
            request.setTitle(title);
            request.setMessage(message);
            request.setGroupId(groupId);
            request.setSectionId(sectionId);
            request.setActorName(actorName);
            request.setSectionType(sectionType);
            
            // Each notifyUser call will check preferences internally
            notifyUser(request);
            notifiedCount++;
        }
        log.info("Notified {} group members for group {} of type {}", notifiedCount, groupId, type);
    }
    
    // Overload for backward compatibility (without sectionType)
    public void notifyGroupMembers(Long groupId, Long sectionId, String type, String title, String message, String actorName) {
        notifyGroupMembers(groupId, sectionId, type, title, message, actorName, null);
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
        dto.setTitle(notification.getTitle());
        dto.setMessage(notification.getMessage());
        dto.setActorName(notification.getActorName());
        dto.setGroupId(notification.getGroup() != null ? notification.getGroup().getId() : null);
        dto.setSectionId(notification.getSection() != null ? notification.getSection().getId() : null);
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
    
    @Transactional
    public void subscribeToPush(PushSubscriptionDto dto) {
        Long userId = AuthUtil.getCurrentUserId();
        if (userId == null) {
            log.warn("subscribeToPush called with null userId");
            return;
        }
        var existing = pushSubscriptionRepository.findByUserIdAndEndpoint(userId, dto.getEndpoint());
        if (existing.isPresent()) {
            log.info("Push subscription already exists for user {}", userId);
            return;
        }
        User user = userRepository.getReferenceById(userId);
        PushSubscription subscription = new PushSubscription();
        subscription.setUser(user);
        subscription.setEndpoint(dto.getEndpoint());
        subscription.setP256dhKey(dto.getKeys().getP256dh());
        subscription.setAuthKey(dto.getKeys().getAuth());
        subscription.setDeviceInfo(dto.getDeviceInfo());
        pushSubscriptionRepository.save(subscription);
        log.info("Push subscription created for user {}", userId);
    }
    
    @Transactional
    public void unsubscribeFromPush(String endpoint) {
        Long userId = AuthUtil.getCurrentUserId();
        pushSubscriptionRepository.deleteByUserIdAndEndpoint(userId, endpoint);
        log.info("Push subscription deleted for user {} and endpoint {}", userId, endpoint);
    }
    
    @Transactional(readOnly = true)
    public NotificationPreferenceDto getPreferencesForGroup(Long groupId) {
        Long userId = AuthUtil.getCurrentUserId();
        GroupMember member = groupMemberRepository.findByUserIdAndGroupId(userId, groupId)
                .orElseThrow(() -> new BadRequestException("You are not a member of this group"));
        
        NotificationPreferenceDto dto = new NotificationPreferenceDto();
        dto.setInAppEnabled(member.isInAppNotificationsEnabled());
        dto.setPushEnabled(member.isPushNotificationsEnabled());
        
        // Fetch section type preferences from the new table
        List<SectionNotificationPreference> prefs = sectionNotificationPreferenceRepository.findByUserIdAndGroupId(userId, groupId);
        java.util.Map<String, String> sectionPreferences = new java.util.HashMap<>();
        
        // Set defaults for all section types - BOTH for critical, IN_APP_ONLY for others
        sectionPreferences.put("NOTE", "IN_APP_ONLY");
        sectionPreferences.put("LIST", "BOTH");
        sectionPreferences.put("LINKS", "IN_APP_ONLY");
        sectionPreferences.put("GALLERY", "IN_APP_ONLY");
        sectionPreferences.put("REMINDER", "BOTH");
        sectionPreferences.put("PAYMENT", "BOTH");
        sectionPreferences.put("CALENDAR", "BOTH");
        sectionPreferences.put("FOLDER", "IN_APP_ONLY");
        
        // Override with actual preferences
        for (SectionNotificationPreference pref : prefs) {
            sectionPreferences.put(pref.getSectionType(), pref.getNotificationMode().name());
        }
        
        dto.setSectionPreferences(sectionPreferences);
        return dto;
    }
    
    @Transactional
    public void updatePreferencesForGroup(Long groupId, NotificationPreferenceDto preferences) {
        Long userId = AuthUtil.getCurrentUserId();
        GroupMember member = groupMemberRepository.findByUserIdAndGroupId(userId, groupId)
                .orElseThrow(() -> new BadRequestException("You are not a member of this group"));
        
        // Update basic preferences
        member.setInAppNotificationsEnabled(preferences.isInAppEnabled());
        member.setPushNotificationsEnabled(preferences.isPushEnabled());
        groupMemberRepository.save(member);
        
        // Update section type preferences
        if (preferences.getSectionPreferences() != null) {
            for (java.util.Map.Entry<String, String> entry : preferences.getSectionPreferences().entrySet()) {
                String sectionType = entry.getKey();
                String modeStr = entry.getValue();
                
                try {
                    NotificationMode mode = NotificationMode.valueOf(modeStr);
                    
                    // Find or create preference record
                    SectionNotificationPreference pref = sectionNotificationPreferenceRepository
                            .findByUserIdAndGroupIdAndSectionType(userId, groupId, sectionType)
                            .orElseGet(() -> {
                                SectionNotificationPreference newPref = new SectionNotificationPreference();
                                newPref.setGroupMember(member);
                                newPref.setSectionType(sectionType);
                                return newPref;
                            });
                    
                    pref.setNotificationMode(mode);
                    pref.setUpdatedAt(java.time.LocalDateTime.now());
                    sectionNotificationPreferenceRepository.save(pref);
                } catch (IllegalArgumentException e) {
                    log.warn("Invalid notification mode: {} for section type: {}", modeStr, sectionType);
                }
            }
        }
        
        log.info("Updated notification preferences for user {} in group {}", userId, groupId);
    }
    
    /**
     * Resolve the frontend URL to navigate to when a push notification is clicked.
     */
    private String resolveClickUrl(String type, Long groupId, Long sectionId) {
        if (sectionId != null && groupId != null) {
            return "/groups/" + groupId + "/sections/" + sectionId;
        }
        return switch (type) {
            case NotificationType.GROUP_INVITE_RECEIVED -> "/groups/join";
            case NotificationType.GROUP_JOIN_REQUEST -> groupId != null ? "/groups/" + groupId + "/manage" : "/dashboard";
            case NotificationType.GROUP_JOIN_APPROVED,
                 NotificationType.GROUP_JOIN_REJECTED,
                 NotificationType.MEMBER_JOINED,
                 NotificationType.GROUP_MEMBER_LEFT,
                 NotificationType.GROUP_MEMBER_REMOVED -> groupId != null ? "/groups/" + groupId : "/dashboard";
            default -> "/dashboard";
        };
    }

    /**
     * Get the notification mode for a specific section type
     */
    private NotificationMode getSectionNotificationMode(Long userId, Long groupId, String sectionType) {
        if (groupId == null || sectionType == null) {
            return NotificationMode.BOTH; // Default to enabled if no group or section type specified
        }
        
        return sectionNotificationPreferenceRepository
                .findByUserIdAndGroupIdAndSectionType(userId, groupId, sectionType)
                .map(SectionNotificationPreference::getNotificationMode)
                .orElseGet(() -> getDefaultNotificationMode(sectionType));
    }
    
    /**
     * Get default notification mode for a section type
     */
    private NotificationMode getDefaultNotificationMode(String sectionType) {
        // Critical types get BOTH (in-app + push), others get IN_APP_ONLY
        return switch (sectionType.toUpperCase()) {
            case "LIST", "REMINDER", "PAYMENT", "CALENDAR" -> NotificationMode.BOTH;
            case "NOTE", "LINKS", "GALLERY", "FOLDER" -> NotificationMode.IN_APP_ONLY;
            default -> NotificationMode.BOTH;
        };
    }
    
    /**
     * Check if a user has in-app notifications enabled for a specific group
     */
    private boolean isInAppNotificationEnabled(Long userId, Long groupId) {
        if (groupId == null) {
            return true; // Default to enabled if no group specified
        }
        return groupMemberRepository.findByUserIdAndGroupId(userId, groupId)
                .map(GroupMember::isInAppNotificationsEnabled)
                .orElse(true); // Default to enabled if not found
    }
    
    /**
     * Check if a user has push notifications enabled for a specific group
     */
    private boolean isPushNotificationEnabled(Long userId, Long groupId) {
        if (groupId == null) {
            return true; // Default to enabled if no group specified
        }
        return groupMemberRepository.findByUserIdAndGroupId(userId, groupId)
                .map(GroupMember::isPushNotificationsEnabled)
                .orElse(true); // Default to enabled if not found
    }
}
