package com.example.frly.notification;

import com.example.frly.group.model.GroupMember;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "section_notification_preferences",
    schema = "config",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"group_member_id", "section_type"})
    }
)
@Getter
@Setter
public class SectionNotificationPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_member_id", nullable = false)
    private GroupMember groupMember;

    @Column(name = "section_type", nullable = false, length = 20)
    private String sectionType;

    @Column(name = "notification_mode", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private NotificationMode notificationMode = NotificationMode.BOTH;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();
}
