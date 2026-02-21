package com.example.frly.section.model;

import com.example.frly.common.GroupAwareEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "list_items", schema = "config")
@Getter
@Setter
public class ListItem extends GroupAwareEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id", nullable = false)
    private Section section;

    @Column(nullable = false)
    private String text;

    @Column(name = "is_completed", nullable = false)
    private boolean isCompleted = false;

    @Column(name = "due_date")
    private LocalDateTime dueDate;

    @Column(name = "position_order")
    private Integer position;
}
