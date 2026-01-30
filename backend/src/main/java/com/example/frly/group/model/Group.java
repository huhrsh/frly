package com.example.frly.group.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "groups", schema = "config")
@Getter
@Setter
public class Group {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_key", nullable = false, unique = true, insertable = false, updatable = false)
    private UUID tenantKey;

    @Column(name = "display_name", nullable = false)
    private String displayName;

    @Column(nullable = false)
    private String status;

    @Column(name = "invite_code", nullable = false, unique = true)
    private String inviteCode;

    @Column(name = "storage_limit", nullable = false)
    private Long storageLimit = 104857600L; // Default 100MB

    @Column(name = "storage_usage", nullable = false)
    private Long storageUsage = 0L;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
