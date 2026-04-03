package com.example.frly.group.dto;

import com.example.frly.common.enums.RecordStatus;
import com.example.frly.group.enums.GroupMemberStatus;
import com.example.frly.group.enums.GroupViewPreference;
import lombok.Data;
import java.time.Instant;

@Data
public class GroupResponseDto {
    private Long id;
    private String name;
    private String displayName;
    private String inviteCode; // Only show to members? Yes.
    private Long storageLimit;
    private Long storageUsage;
    private Instant createdAt;
    private RecordStatus status;
    private String currentUserRole;

    // Membership status for the current user (e.g. PENDING, APPROVED)
    private GroupMemberStatus membershipStatus;

    // For admins: how many pending join requests this group currently has
    private Long pendingMemberCount;

    // View preference for the current user in this group (e.g. WORKSPACE, BENTO)
    private GroupViewPreference viewPreference;

    // Whether the current user has pinned this group on the dashboard
    private boolean pinned;
}
