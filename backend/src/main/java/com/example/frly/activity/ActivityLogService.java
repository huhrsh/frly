package com.example.frly.activity;

import com.example.frly.auth.AuthUtil;
import com.example.frly.group.enums.GroupMemberStatus;
import com.example.frly.group.repository.GroupMemberRepository;
import com.example.frly.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserRepository userRepository;

    /**
     * Fire-and-forget log call. Never throws — failures are silently logged.
     */
    @Async
    public void log(String groupId, Long actorId, String actorName, String actorPfpUrl,
                    String actionType, String entityName, Long sectionId, String sectionName) {
        try {
            ActivityLog entry = new ActivityLog();
            entry.setGroupId(groupId);
            entry.setActorId(actorId);
            entry.setActorName(actorName);
            entry.setActionType(actionType);
            entry.setEntityName(entityName);
            entry.setSectionId(sectionId);
            entry.setSectionName(sectionName);
            activityLogRepository.save(entry);
        } catch (Exception e) {
            log.warn("Failed to write activity log entry: {}", e.getMessage());
        }
    }

    public List<ActivityLogDto> getGroupActivity(String groupId, int page, int size) {
        List<ActivityLog> logs = activityLogRepository
                .findByGroupIdOrderByCreatedAtDesc(groupId, PageRequest.of(page, size));
        Map<Long, String> pfpUrls = resolveActorPfpUrls(logs);
        return logs.stream()
                .map(l -> ActivityLogDto.from(l, null, pfpUrls.get(l.getActorId())))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ActivityLogDto> getRecentForCurrentUser(int page, int size) {
        Long userId = AuthUtil.getCurrentUserId();
        var memberships = groupMemberRepository.findByUserId(userId)
                .stream()
                .filter(m -> m.getStatus() == GroupMemberStatus.APPROVED)
                .collect(Collectors.toList());

        if (memberships.isEmpty()) return List.of();

        Map<String, String> groupNames = memberships.stream()
                .collect(Collectors.toMap(
                        m -> String.valueOf(m.getGroup().getId()),
                        m -> m.getGroup().getDisplayName(),
                        (a, b) -> a
                ));

        List<String> groupIds = new java.util.ArrayList<>(groupNames.keySet());

        List<ActivityLog> logs = activityLogRepository
                .findByGroupIdInOrderByCreatedAtDesc(groupIds, PageRequest.of(page, size));
        Map<Long, String> pfpUrls = resolveActorPfpUrls(logs);
        return logs.stream()
                .map(l -> ActivityLogDto.from(l, groupNames.getOrDefault(l.getGroupId(), null), pfpUrls.get(l.getActorId())))
                .collect(Collectors.toList());
    }

    private Map<Long, String> resolveActorPfpUrls(List<ActivityLog> logs) {
        List<Long> actorIds = logs.stream()
                .map(ActivityLog::getActorId)
                .filter(id -> id != null)
                .distinct()
                .collect(Collectors.toList());
        if (actorIds.isEmpty()) return Map.of();
        return userRepository.findAllById(actorIds).stream()
                .collect(Collectors.toMap(
                        com.example.frly.user.User::getId,
                        u -> u.getPfpUrl() != null ? u.getPfpUrl() : "",
                        (a, b) -> a
                ));
    }
}
