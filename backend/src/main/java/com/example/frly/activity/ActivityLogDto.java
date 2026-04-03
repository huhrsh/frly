package com.example.frly.activity;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class ActivityLogDto {
    private Long id;
    private String groupId;
    private Long actorId;
    private String actorName;
    private String actionType;
    private String entityName;
    private Long sectionId;
    private String sectionName;
    private LocalDateTime createdAt;

    public static ActivityLogDto from(ActivityLog log) {
        return new ActivityLogDto(
            log.getId(),
            log.getGroupId(),
            log.getActorId(),
            log.getActorName(),
            log.getActionType(),
            log.getEntityName(),
            log.getSectionId(),
            log.getSectionName(),
            log.getCreatedAt()
        );
    }
}
