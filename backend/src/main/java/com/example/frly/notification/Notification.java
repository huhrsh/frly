package com.example.frly.notification;

import com.example.frly.group.model.Group;
import com.example.frly.section.model.Section;
import com.example.frly.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications", schema = "config")
@Getter
@Setter
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    private Group group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id")
    private Section section;

    @Column(name = "type", nullable = false, length = 50)
    private String type;

    @Column(name = "title", length = 255)
    private String title;

    @Column(name = "message", nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "actor_name", length = 255)
    private String actorName;

    @Column(name = "actor_pfp_url")
    private String actorPfpUrl;

    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
