package com.example.frly.section.model;

import com.example.frly.common.GroupAwareEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "reminders", schema = "config")
@Getter
@Setter
public class Reminder extends GroupAwareEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id", nullable = false)
    private Section section;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "trigger_time", nullable = false)
    private LocalDateTime triggerTime;

    @Column(name = "is_sent", nullable = false)
    private boolean isSent = false;

    @Column(name = "notify", nullable = false)
    private boolean notify = false;

    // Simple frequency hint for scheduling (e.g. ONCE, DAILY, WEEKLY)
    @Column(name = "frequency", length = 32)
    private String frequency;
}
