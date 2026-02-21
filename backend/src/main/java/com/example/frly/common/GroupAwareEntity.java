package com.example.frly.common;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.TenantId;

@Getter
@Setter
@MappedSuperclass
public abstract class GroupAwareEntity extends AuditableEntity {

    @TenantId
    @Column(name = "group_id", nullable = false)
    private String groupId;
}
