package com.example.frly.entity;

import jakarta.persistence.*;
import lombok.Getter;

@Entity
@Table(
        name = "user_tenant_roles",
        schema = "config",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"user_id", "tenant_id", "role_id"})
        }
)
@Getter
public class UserTenantRole {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private TenantRegistry tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;
}
