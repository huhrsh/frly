package com.example.frly.group.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class GroupResponseDto {
    private Long id;
    private String name;
    private String displayName;
    private String inviteCode; // Only show to members? Yes.
    private Long storageLimit;
    private Long storageUsage;
    private LocalDateTime createdAt;
    private String status;
    private String currentUserRole;

    // Membership status for the current user (e.g. PENDING, APPROVED)
    private String membershipStatus;

    // For admins: how many pending join requests this group currently has
    private Long pendingMemberCount;

    // View preference for the current user in this group (e.g. WORKSPACE, BENTO)
    private String viewPreference;
}
