package com.example.frly.activity;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class ActivityLogDto {
    private Long id;
    private String groupId;
    private String groupName;
    private Long actorId;
    private String actorName;
    private String actorPfpUrl;
    private String actionType;
    private String entityName;
    private Long sectionId;
    private String sectionName;
    private LocalDateTime createdAt;

    public static ActivityLogDto from(ActivityLog log) {
        return from(log, null, null);
    }

    public static ActivityLogDto from(ActivityLog log, String groupName) {
        return from(log, groupName, null);
    }

    public static ActivityLogDto from(ActivityLog log, String groupName, String resolvedActorPfpUrl) {
        return new ActivityLogDto(
            log.getId(),
            log.getGroupId(),
            groupName,
            log.getActorId(),
            log.getActorName(),
            resolvedActorPfpUrl,
            log.getActionType(),
            log.getEntityName(),
            log.getSectionId(),
            log.getSectionName(),
            log.getCreatedAt()
        );
    }
}
