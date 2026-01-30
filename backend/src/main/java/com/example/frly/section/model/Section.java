package com.example.frly.section.model;

import com.example.frly.common.GroupAwareEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "sections", schema = "config")
@Getter
@Setter
public class Section extends GroupAwareEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SectionType type;

    @Column(name = "position_order")
    private Integer position;

    // Section-level password protection was removed; columns dropped via migration.

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Section parentSection;
}
