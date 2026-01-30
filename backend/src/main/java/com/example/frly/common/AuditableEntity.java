package com.example.frly.common;

import com.example.frly.auth.AuthUtil;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import java.time.Instant;

@Getter
@Setter
@MappedSuperclass
public abstract class AuditableEntity {
    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "created_by", updatable = false)
    private Long createdBy;

    @Column(name = "updated_by")
    private Long updatedBy;

    @PrePersist
    public void prePersist() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        this.createdBy = AuthUtil.getCurrentUserId();
        this.updatedBy = AuthUtil.getCurrentUserId();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
        this.updatedBy = AuthUtil.getCurrentUserId();
    }

}
