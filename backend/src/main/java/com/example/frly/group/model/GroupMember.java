package com.example.frly.group.model;

import com.example.frly.common.Role;
import com.example.frly.group.enums.GroupMemberStatus;
import com.example.frly.group.enums.GroupViewPreference;
import com.example.frly.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(
        name = "group_members",
        schema = "config",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"user_id", "group_id", "role_id"})
        }
)
@Getter
@Setter
public class GroupMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    private GroupMemberStatus status = GroupMemberStatus.PENDING;

        @Column(name = "view_preference", nullable = false)
        @Enumerated(EnumType.STRING)
        private GroupViewPreference viewPreference = GroupViewPreference.WORKSPACE;

}
