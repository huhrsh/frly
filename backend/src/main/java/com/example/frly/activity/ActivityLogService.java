package com.example.frly.activity;

import com.example.frly.auth.AuthUtil;
import com.example.frly.group.enums.GroupMemberStatus;
import com.example.frly.group.repository.GroupMemberRepository;
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
            entry.setActorPfpUrl(actorPfpUrl);
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
        return activityLogRepository
                .findByGroupIdOrderByCreatedAtDesc(groupId, PageRequest.of(page, size))
                .stream()
                .map(ActivityLogDto::from)
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

        return activityLogRepository
                .findByGroupIdInOrderByCreatedAtDesc(groupIds, PageRequest.of(page, size))
                .stream()
                .map(log -> ActivityLogDto.from(log, groupNames.getOrDefault(log.getGroupId(), null)))
                .collect(Collectors.toList());
    }
}
