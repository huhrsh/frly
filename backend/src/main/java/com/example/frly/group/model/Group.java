package com.example.frly.group.model;

import com.example.frly.common.AuditableEntity;
import com.example.frly.common.Role;
import com.example.frly.common.enums.RecordStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "groups", schema = "config")
@Getter
@Setter
public class Group extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_key", nullable = false, unique = true, insertable = false, updatable = false)
    private UUID tenantKey;

    @Column(name = "display_name", nullable = false)
    private String displayName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RecordStatus status;

    @Column(name = "invite_code", nullable = false, unique = true)
    private String inviteCode;

    @Column(name = "storage_limit", nullable = false)
    private Long storageLimit = 104857600L; // Default 100MB

    @Column(name = "storage_usage", nullable = false)
    private Long storageUsage = 0L;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "default_member_role_id", nullable = false)
    private Role defaultMemberRole;
}
