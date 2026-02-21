package com.example.frly.section.model;

import com.example.frly.common.GroupAwareEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "notes", schema = "config")
@Getter
@Setter
public class Note extends GroupAwareEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id", nullable = false, unique = true)
    private Section section;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Version
    @Column(name = "version", nullable = false)
    private Integer version;
}
