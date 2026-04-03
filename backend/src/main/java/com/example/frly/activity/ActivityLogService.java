package com.example.frly.activity;

import com.example.frly.auth.AuthUtil;
import com.example.frly.group.enums.GroupMemberStatus;
import com.example.frly.group.repository.GroupMemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
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
    public void log(String groupId, Long actorId, String actorName,
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
        return activityLogRepository
                .findByGroupIdOrderByCreatedAtDesc(groupId, PageRequest.of(page, size))
                .stream()
                .map(ActivityLogDto::from)
                .collect(Collectors.toList());
    }

    public List<ActivityLogDto> getRecentForCurrentUser(int limit) {
        Long userId = AuthUtil.getCurrentUserId();
        List<String> groupIds = groupMemberRepository.findByUserId(userId)
                .stream()
                .filter(m -> m.getStatus() == GroupMemberStatus.APPROVED)
                .map(m -> String.valueOf(m.getGroup().getId()))
                .collect(Collectors.toList());

        if (groupIds.isEmpty()) return List.of();

        return activityLogRepository
                .findByGroupIdInOrderByCreatedAtDesc(groupIds, PageRequest.of(0, limit))
                .stream()
                .map(ActivityLogDto::from)
                .collect(Collectors.toList());
    }
}
