package com.example.frly.group.service;

import com.example.frly.group.dto.CreateGroupRequestDto;
import com.example.frly.group.dto.GroupResponseDto;
import com.example.frly.group.dto.GroupMemberSimpleDto;
import com.example.frly.group.dto.UpdateViewPreferenceRequestDto;
import com.example.frly.group.dto.JoinGroupRequestDto;
import com.example.frly.group.dto.GroupJoinRequestDto;
import com.example.frly.auth.AuthUtil;
import com.example.frly.common.Role;
import com.example.frly.common.RoleRepository;
import com.example.frly.group.enums.GroupMemberStatus;
import com.example.frly.common.enums.RecordStatus;
import com.example.frly.user.User;
import com.example.frly.user.UserRepository;
import com.example.frly.group.repository.GroupRepository;
import com.example.frly.group.repository.GroupMemberRepository;
import com.example.frly.group.model.Group;
import com.example.frly.group.model.GroupMember;
import com.example.frly.group.GroupContext;
import com.example.frly.activity.ActivityLogService;
import com.example.frly.activity.ActivityType;
import com.example.frly.notification.NotificationService;
import com.example.frly.notification.NotificationType;
import com.example.frly.notification.NotificationRequest;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import com.example.frly.common.exception.BadRequestException;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

import static com.example.frly.constants.LogConstants.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class GroupService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final ActivityLogService activityLogService;
    private final EntityManager entityManager;
    private static final String CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ123456789";
    private static final int CODE_LENGTH = 8;
    private static final SecureRandom random = new SecureRandom();

    @Transactional
    public Long createGroup(CreateGroupRequestDto request) {
        // 0. Get current user
        Long userId = AuthUtil.getCurrentUserId();
        User user = userRepository.getReferenceById(userId);

        // 1. Create and Save Group
        Group group = new Group();
        group.setDisplayName(request.getDisplayName());
        group.setStatus(RecordStatus.ACTIVE);

        // Generate simple 8-char invite code
        String inviteCode = generateInviteCode();
        group.setInviteCode(inviteCode);

        // 2. Assign OWNER role to creator; default member role is MEMBER
        Role ownerRole = roleRepository.findByName("OWNER")
                .orElseThrow(() -> new RuntimeException("Error: Role 'OWNER' is not found."));
        Role memberRole = roleRepository.findByName("MEMBER")
                .orElseThrow(() -> new RuntimeException("Error: Role 'MEMBER' is not found."));
        group.setDefaultMemberRole(memberRole);

        group = groupRepository.save(group);

        GroupMember groupMember = new GroupMember();
        groupMember.setGroup(group);
        groupMember.setUser(user);
        groupMember.setRole(ownerRole);
        groupMember.setStatus(GroupMemberStatus.APPROVED);

        groupMemberRepository.save(groupMember);

        log.info("Group created successfully: id={}", group.getId());
        return group.getId();
    }

    public String generateInviteCode() {
        String inviteCode = "";
        do {
            StringBuilder code = new StringBuilder(CODE_LENGTH);
            for (int i = 0; i < CODE_LENGTH; i++) {
                code.append(CHARS.charAt(random.nextInt(CHARS.length())));
            }
            inviteCode = code.toString();
        } while (groupRepository.existsByInviteCode(inviteCode));
        return inviteCode;
    }

    @Transactional
    public Long joinGroup(JoinGroupRequestDto request) {
        Long userId = AuthUtil.getCurrentUserId();
        User user = userRepository.getReferenceById(userId);

        Group group = groupRepository.findByInviteCode(request.getInviteCode())
            .orElseThrow(() -> new BadRequestException("Invalid invite code"));

        if (group.getStatus() != RecordStatus.ACTIVE) {
            throw new BadRequestException("Group is not active");
        }
        
        // Check for existing membership to support re-join behavior
        Optional<GroupMember> existingOpt = groupMemberRepository.findByUserIdAndGroupId(userId, group.getId());
        if (existingOpt.isPresent()) {
            GroupMember existing = existingOpt.get();
            if (existing.getStatus() == GroupMemberStatus.REMOVED) {
                // Allow user to rejoin: turn removed membership back into a pending request
                existing.setStatus(GroupMemberStatus.PENDING);
                groupMemberRepository.save(existing);

                log.info("User {} re-requested to join Group {} (reusing removed membership)", userId, group.getId());

                // Notify admins about the new join request
                String rejoinMsg = String.format("%s %s requested to rejoin group '%s'",
                    user.getFirstName(), user.getLastName(), group.getDisplayName());
                NotificationRequest rejoinReq = new NotificationRequest(
                        null,
                        NotificationType.GROUP_JOIN_REQUEST,
                        "Join request",
                        rejoinMsg,
                        group.getId(),
                        null,
                        user.getFirstName() + " " + user.getLastName()
                );
                rejoinReq.setActorId(userId);
                notifyAdminsAndOwners(group.getId(), rejoinReq);

                return group.getId();
            } else {
                throw new BadRequestException("You are already a member or have a pending request");
            }
        }

        Role defaultRole = group.getDefaultMemberRole() != null
                ? group.getDefaultMemberRole()
                : roleRepository.findByName("MEMBER")
                        .orElseThrow(() -> new RuntimeException("Error: Role 'MEMBER' is not found."));

        GroupMember groupMember = new GroupMember();
        groupMember.setGroup(group);
        groupMember.setUser(user);
        groupMember.setRole(defaultRole);
        groupMember.setStatus(GroupMemberStatus.PENDING);

        groupMemberRepository.save(groupMember);
        log.info("User {} requested to join Group {}", userId, group.getId());

        // Notify all admins and owners of this group about the join request
        String joinMsg = String.format("%s %s requested to join group '%s'",
            user.getFirstName(), user.getLastName(), group.getDisplayName());
        NotificationRequest joinReq = new NotificationRequest(
                null,
                NotificationType.GROUP_JOIN_REQUEST,
                "Join request",
                joinMsg,
                group.getId(),
                null,
                user.getFirstName() + " " + user.getLastName()
        );
        joinReq.setActorId(userId);
        notifyAdminsAndOwners(group.getId(), joinReq);

        return group.getId();
    }

    @Transactional
    public void approveMember(Long memberId) {
        // 1. Validate Admin Access (current user must be admin of the group this member belongs to)
        // This is tricky because we need to know WHICH group.
        // Simplified: We assume the caller passed the Group ID in header, and we check permissions.

        String currentGroupIdStr = GroupContext.getGroupId();
        if (currentGroupIdStr == null || currentGroupIdStr.equals("0")) {
            throw new BadRequestException("Group Context Missing");
        }
        Long currentGroupId = Long.parseLong(currentGroupIdStr);

        // Verify Caller is Admin
        Long currentUserId = AuthUtil.getCurrentUserId();
        // Validate caller is ADMIN for this group
        validateAdminAccess(currentUserId, currentGroupId);

        GroupMember memberToApprove = groupMemberRepository.findById(memberId)
                .orElseThrow(() -> new BadRequestException("Member request not found"));

        if (!memberToApprove.getGroup().getId().equals(currentGroupId)) {
            throw new BadRequestException("Member does not belong to the current group context");
        }

        // Check if Caller is ADMIN of this group
        // We can do this efficiently via repository or re-fetching caller's member record.
        // For MVP speed:
        // validateGroupAccess(currentUserId, currentGroupIdStr); // Checks existence.
        // We need to check ROLE.

        memberToApprove.setStatus(GroupMemberStatus.APPROVED);
        groupMemberRepository.save(memberToApprove);
        log.info("Member {} approved for Group {}", memberId, currentGroupId);

        // Get the admin who approved the request
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new BadRequestException("Current user not found"));
        String actorName = String.format("%s %s", currentUser.getFirstName(), currentUser.getLastName()).trim();

        // Notify the user that their request was approved
        notificationService.notifyUser(
            new NotificationRequest(
                memberToApprove.getUser().getId(),
                NotificationType.GROUP_JOIN_APPROVED,
                "Group join approved",
                String.format("Your request to join group '%s' has been approved.",
                    memberToApprove.getGroup().getDisplayName()),
                currentGroupId,
                null,
                actorName
            )
        );

        // Notify other group members that someone joined
        String newMemberName = String.format("%s %s", 
            memberToApprove.getUser().getFirstName(), 
            memberToApprove.getUser().getLastName()).trim();
        
        groupMemberRepository.findByGroupIdAndStatus(currentGroupId, GroupMemberStatus.APPROVED)
            .stream()
            .filter(gm -> !gm.getUser().getId().equals(memberToApprove.getUser().getId()))
            .forEach(gm -> {
                notificationService.notifyUser(
                    new NotificationRequest(
                        gm.getUser().getId(),
                        NotificationType.MEMBER_JOINED,
                        "New member joined",
                        String.format("%s joined group '%s'", newMemberName, memberToApprove.getGroup().getDisplayName()),
                        currentGroupId,
                        null,
                        newMemberName
                    )
                );
            });
        activityLogService.log(String.valueOf(currentGroupId), memberToApprove.getUser().getId(), newMemberName,
                memberToApprove.getUser().getPfpUrl(),
                ActivityType.MEMBER_JOINED, newMemberName, null, null);
    }
    
    public GroupResponseDto getGroupDetails(Long groupId) {
        // Validation check for simplified context access
        String updatedGroupId = Objects.nonNull(GroupContext.getGroupId()) ? GroupContext.getGroupId() : String.valueOf(groupId);
        validateGroupAccess(AuthUtil.getCurrentUserId(), updatedGroupId);
        
        Group group = groupRepository.findById(groupId).orElseThrow();
        
        GroupResponseDto dto = new com.example.frly.group.dto.GroupResponseDto();
        dto.setId(group.getId());
//        dto.setName(group.getName());
        dto.setDisplayName(group.getDisplayName());
        dto.setInviteCode(group.getInviteCode());
        dto.setStorageLimit(group.getStorageLimit());
        dto.setStorageUsage(group.getStorageUsage());
        dto.setCreatedAt(group.getCreatedAt());
        dto.setStatus(group.getStatus());
        
           // Populate User Role, membership status and view preference
           Long userId = AuthUtil.getCurrentUserId();
           groupMemberRepository.findByUserIdAndGroupId(userId, groupId)
               .ifPresent(member -> {
                  dto.setCurrentUserRole(member.getRole().getName());
                  dto.setMembershipStatus(member.getStatus());
                  dto.setPinned(member.isPinned());
                  if (member.getViewPreference() != null) {
                      dto.setViewPreference(member.getViewPreference());
                  }
               });

           // For admins, expose how many pending members are waiting
           long pendingCount = groupMemberRepository.countByGroupIdAndStatus(groupId, GroupMemberStatus.PENDING);
           dto.setPendingMemberCount(pendingCount);

        if (group.getDefaultMemberRole() != null) {
            dto.setDefaultMemberRole(group.getDefaultMemberRole().getName());
        }

        return dto;
    }

    public java.util.List<com.example.frly.group.dto.GroupResponseDto> getUserGroups(Long userId) {
        // Exclude memberships that were explicitly removed by the user/admin
        return groupMemberRepository.findByUserIdAndStatusNot(userId, GroupMemberStatus.REMOVED).stream()
                .map(member -> {
                    Group group = member.getGroup();
                    if (group.getStatus() == RecordStatus.DELETED) {
                        return null;
                    }
                    GroupResponseDto dto = new com.example.frly.group.dto.GroupResponseDto();
                    dto.setId(group.getId());
//                    dto.setName(group.getName());
                    dto.setDisplayName(group.getDisplayName());
                    dto.setInviteCode(group.getInviteCode());
                    dto.setStorageLimit(group.getStorageLimit());
                    dto.setStorageUsage(group.getStorageUsage());
                    dto.setCreatedAt(group.getCreatedAt());
                    dto.setStatus(group.getStatus());
                    dto.setCurrentUserRole(member.getRole().getName());
                    dto.setMembershipStatus(member.getStatus());
                    dto.setPinned(member.isPinned());

                    if (member.getViewPreference() != null) {
                        dto.setViewPreference(member.getViewPreference());
                    }

                    long pendingCount = groupMemberRepository.countByGroupIdAndStatus(group.getId(), GroupMemberStatus.PENDING);
                    dto.setPendingMemberCount(pendingCount);
                    return dto;
                })
                .filter(java.util.Objects::nonNull)
                .sorted((a, b) -> {
                    if (a.getDisplayName() == null || b.getDisplayName() == null) {
                        return 0;
                    }
                    return a.getDisplayName().compareToIgnoreCase(b.getDisplayName());
                })
                .collect(java.util.stream.Collectors.toList());
    }

    @org.springframework.transaction.annotation.Transactional
    public com.example.frly.group.dto.GroupResponseDto updateGroup(Long groupId, com.example.frly.group.dto.UpdateGroupRequestDto request) {
        Long currentUserId = AuthUtil.getCurrentUserId();
        validateAdminAccess(currentUserId, groupId);

        if (request == null || (request.getDisplayName() == null || request.getDisplayName().trim().isEmpty())) {
            throw new BadRequestException("Nothing to update");
        }

        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new BadRequestException("Group not found"));

        if (group.getStatus() == RecordStatus.DELETED) {
            throw new BadRequestException("Cannot update a deleted group");
        }

        if (request.getDisplayName() != null && !request.getDisplayName().trim().isEmpty()) {
            group.setDisplayName(request.getDisplayName().trim());
        }

        groupRepository.save(group);

        return getGroupDetails(groupId);
    }

    @Transactional
    public void deleteGroup(Long groupId) {
        Long currentUserId = AuthUtil.getCurrentUserId();
        validateOwnerAccess(currentUserId, groupId);

        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new BadRequestException("Group not found"));

        group.setStatus(RecordStatus.DELETED);
        groupRepository.save(group);
    }


    public void updateViewPreference(Long userId, Long groupId, UpdateViewPreferenceRequestDto request) {
        if (request == null || request.getViewPreference() == null) {
            throw new BadRequestException("viewPreference is required");
        }

        GroupMember member = groupMemberRepository.findByUserIdAndGroupId(userId, groupId)
                .orElseThrow(() -> new BadRequestException("Access Denied: You are not a member of this group"));

        member.setViewPreference(request.getViewPreference());
        groupMemberRepository.save(member);
    }


    @Transactional(readOnly = true)
    public void validateGroupAccess(Long userId, String groupIdStr) {
        if (groupIdStr == null || groupIdStr.equals("0")) {
            log.warn("{}, {}", SECURITY_GROUP_ID_MISSING, groupIdStr);
            throw new BadRequestException("Group ID missing in context");
        }

        try {
            Long groupId = Long.parseLong(groupIdStr);

            GroupMember member = groupMemberRepository.findByUserIdAndGroupId(userId, groupId)
                    .orElseThrow(() -> {
                        log.warn("{}, User: {}, Group: {}", SECURITY_ALERT_NO_ACCESS, userId, groupId);
                        return new BadRequestException("Access Denied: You are not a member of this group");
                    });

            // Prevent access to soft-deleted groups
            if (member.getGroup() != null && member.getGroup().getStatus() == RecordStatus.DELETED) {
                log.warn("SECURITY ALERT: User {} attempted access to deleted group {}", userId, groupId);
                throw new BadRequestException("Access Denied: This group has been deleted");
            }

            if (member.getStatus() != GroupMemberStatus.APPROVED) {
                log.warn("SECURITY ALERT: Non-approved membership {} for user {} on group {}", member.getStatus(), userId, groupId);
                throw new BadRequestException("Access Denied: Your membership is not approved for this group");
            }
        } catch (NumberFormatException e) {
            throw new BadRequestException("Invalid Group ID format");
        }
    }

    @Transactional(readOnly = true)
    public java.util.List<GroupJoinRequestDto> getPendingMembers(Long groupId) {
        Long currentUserId = AuthUtil.getCurrentUserId();
        validateAdminAccess(currentUserId, groupId);

        return groupMemberRepository.findByGroupIdAndStatus(groupId, GroupMemberStatus.PENDING)
                .stream()
                .map(member -> {
                    GroupJoinRequestDto dto = new GroupJoinRequestDto();
                    dto.setMemberId(member.getId());
                    dto.setUserId(member.getUser().getId());
                    dto.setFirstName(member.getUser().getFirstName());
                    dto.setLastName(member.getUser().getLastName());
                    dto.setEmail(member.getUser().getEmail());
                    dto.setStatus(member.getStatus());
                    return dto;
                })
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional(readOnly = true)
    public java.util.List<GroupMemberSimpleDto> getApprovedMembers(Long groupId) {
        Long currentUserId = AuthUtil.getCurrentUserId();
        validateGroupAccess(currentUserId, String.valueOf(groupId));

        return groupMemberRepository.findByGroupIdAndStatus(groupId, GroupMemberStatus.APPROVED)
                .stream()
                .map(member -> {
                    GroupMemberSimpleDto dto = new GroupMemberSimpleDto();
                    dto.setUserId(member.getUser().getId());
                    dto.setFirstName(member.getUser().getFirstName());
                    dto.setLastName(member.getUser().getLastName());
                    dto.setEmail(member.getUser().getEmail());
                    dto.setRole(member.getRole().getName());
                    dto.setPfpUrl(member.getUser().getPfpUrl());
                    return dto;
                })
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public void removeMember(Long groupId, Long userIdToRemove) {
        Long currentUserId = AuthUtil.getCurrentUserId();
        // If a member is removing themselves, treat this as "leave group" and notify admins
        if (currentUserId.equals(userIdToRemove)) {
            GroupMember member = groupMemberRepository.findByUserIdAndGroupId(currentUserId, groupId)
                .orElseThrow(() -> new BadRequestException("Member not found in this group"));

            member.setStatus(GroupMemberStatus.REMOVED);
            groupMemberRepository.save(member);

            Group group = member.getGroup();

            String actorName = String.format("%s %s", member.getUser().getFirstName(), member.getUser().getLastName()).trim();

            // Notify the member that they left
            NotificationRequest leftNotif = new NotificationRequest(
                    currentUserId,
                    NotificationType.GROUP_LEFT,
                    "Left group",
                    String.format("You left group '%s'.", group.getDisplayName()),
                    groupId,
                    null,
                    actorName
            );
            leftNotif.setActorId(currentUserId);
            notificationService.notifyUser(leftNotif);

            // Notify all admins and owners (except the leaving member) that someone left
            String leftMsg = String.format("%s left group '%s'", actorName, group.getDisplayName());
            NotificationRequest memberLeftReq = new NotificationRequest(
                    null,
                    NotificationType.GROUP_MEMBER_LEFT,
                    "Member left",
                    leftMsg,
                    groupId,
                    null,
                    actorName
            );
            memberLeftReq.setActorId(currentUserId);
            notifyAdminsAndOwners(groupId, memberLeftReq, currentUserId);
            return;
        }

        // Admin removing another member
        validateAdminAccess(currentUserId, groupId);

        GroupMember member = groupMemberRepository.findByUserIdAndGroupId(userIdToRemove, groupId)
            .orElseThrow(() -> new BadRequestException("Member not found in this group"));

        GroupMemberStatus originalStatus = member.getStatus();
        member.setStatus(GroupMemberStatus.REMOVED);
        groupMemberRepository.save(member);

        Group group = member.getGroup();

        // Get the admin who removed/rejected the member
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new BadRequestException("Current user not found"));
        String actorName = String.format("%s %s", currentUser.getFirstName(), currentUser.getLastName()).trim();

        // Send different notifications based on original status
        if (originalStatus == GroupMemberStatus.PENDING) {
            // This was a join request rejection - notify the user their request was declined
            notificationService.notifyUser(
                new NotificationRequest(
                    userIdToRemove,
                    NotificationType.GROUP_JOIN_REJECTED,
                    "Join request declined",
                    String.format("Your request to join group '%s' was declined.", group.getDisplayName()),
                    groupId,
                    null,
                    actorName
                )
            );
        } else if (originalStatus == GroupMemberStatus.APPROVED) {
            // This was an actual member removal - notify them they were removed
            notificationService.notifyUser(
                new NotificationRequest(
                    userIdToRemove,
                    NotificationType.GROUP_MEMBER_REMOVED,
                    "Removed from group",
                    String.format("You have been removed from group '%s' by %s.", group.getDisplayName(), actorName),
                    groupId,
                    null,
                    actorName
                )
            );
            String removedName = String.format("%s %s", member.getUser().getFirstName(), member.getUser().getLastName()).trim();
            activityLogService.log(String.valueOf(groupId), currentUserId, actorName,
                    currentUser.getPfpUrl(),
                    ActivityType.MEMBER_REMOVED, removedName, null, null);
        }
        // If status was REMOVED, no notification needed
    }

    @Transactional
    public void togglePinGroup(Long groupId) {
        Long userId = AuthUtil.getCurrentUserId();
        GroupMember member = groupMemberRepository.findByUserIdAndGroupId(userId, groupId)
                .orElseThrow(() -> new BadRequestException("Not a member of this group"));
        member.setPinned(!member.isPinned());
        groupMemberRepository.save(member);
    }

    @Transactional
    public void markGroupSeen(Long groupId) {
        Long userId = AuthUtil.getCurrentUserId();
        groupMemberRepository.findByUserIdAndGroupId(userId, groupId).ifPresent(member -> {
            member.setLastSeenAt(LocalDateTime.now());
            groupMemberRepository.save(member);
        });
    }

    @SuppressWarnings("unchecked")
    public Map<Long, Boolean> getActivityStatus() {
        Long userId = AuthUtil.getCurrentUserId();
        String sql =
            "SELECT gm.group_id, " +
            "EXISTS(" +
            "    SELECT 1 FROM config.activity_log al" +
            "    WHERE al.group_id = CAST(gm.group_id AS VARCHAR)" +
            "    AND al.created_at > COALESCE(gm.last_seen_at, CAST('1970-01-01' AS TIMESTAMP))" +
            "    AND al.actor_id != :userId" +
            ") AS has_new " +
            "FROM config.group_members gm " +
            "WHERE gm.user_id = :userId AND gm.status = 'APPROVED'";

        java.util.List<Object[]> rows = entityManager.createNativeQuery(sql)
                .setParameter("userId", userId)
                .getResultList();

        Map<Long, Boolean> result = new HashMap<>();
        for (Object[] row : rows) {
            Long groupId = row[0] != null ? ((Number) row[0]).longValue() : null;
            boolean hasNew = row[1] != null && (Boolean) row[1];
            if (groupId != null) {
                result.put(groupId, hasNew);
            }
        }
        return result;
    }

    @Transactional(readOnly = true)
    public void validateAdminAccess(Long userId, Long groupId) {
        GroupMember member = groupMemberRepository.findByUserIdAndGroupId(userId, groupId)
                .orElseThrow(() -> new BadRequestException("Access Denied: You are not a member of this group"));

        if (member.getStatus() != GroupMemberStatus.APPROVED) {
            log.warn("SECURITY ALERT: Non-approved member {} attempted admin operation on group {}", userId, groupId);
            throw new BadRequestException("Access Denied: Your membership is not approved for this group");
        }

        String role = member.getRole() != null ? member.getRole().getName() : null;
        if (!"ADMIN".equals(role) && !"OWNER".equals(role)) {
            log.warn("SECURITY ALERT: Member {} without admin/owner role attempted admin operation on group {}", userId, groupId);
            throw new BadRequestException("Access Denied: Admins and Owners only");
        }
    }

    @Transactional(readOnly = true)
    public void validateOwnerAccess(Long userId, Long groupId) {
        GroupMember member = groupMemberRepository.findByUserIdAndGroupId(userId, groupId)
                .orElseThrow(() -> new BadRequestException("Access Denied: You are not a member of this group"));

        if (member.getStatus() != GroupMemberStatus.APPROVED) {
            throw new BadRequestException("Access Denied: Your membership is not approved for this group");
        }

        if (member.getRole() == null || !"OWNER".equals(member.getRole().getName())) {
            log.warn("SECURITY ALERT: Non-owner user {} attempted owner-only operation on group {}", userId, groupId);
            throw new BadRequestException("Access Denied: Owners only");
        }
    }

    @Transactional(readOnly = true)
    public void validateNotViewer(Long userId, Long groupId) {
        GroupMember member = groupMemberRepository.findByUserIdAndGroupId(userId, groupId)
                .orElseThrow(() -> new BadRequestException("Access Denied: You are not a member of this group"));

        if (member.getStatus() != GroupMemberStatus.APPROVED) {
            throw new BadRequestException("Access Denied: Your membership is not approved for this group");
        }

        String role = member.getRole() != null ? member.getRole().getName() : null;
        if ("VIEWER".equals(role)) {
            log.warn("SECURITY ALERT: Viewer user {} attempted write operation on group {}", userId, groupId);
            throw new BadRequestException("Access Denied: Viewers cannot modify content");
        }
    }

    @Transactional
    public void updateMemberRole(Long groupId, Long targetUserId, String newRoleName) {
        Long currentUserId = AuthUtil.getCurrentUserId();
        validateOwnerAccess(currentUserId, groupId);

        if (!"ADMIN".equals(newRoleName) && !"MEMBER".equals(newRoleName) && !"VIEWER".equals(newRoleName)) {
            throw new BadRequestException("Role must be ADMIN, MEMBER, or VIEWER");
        }

        GroupMember target = groupMemberRepository.findByUserIdAndGroupId(targetUserId, groupId)
                .orElseThrow(() -> new BadRequestException("Member not found in this group"));

        if ("OWNER".equals(target.getRole().getName())) {
            throw new BadRequestException("Cannot change the role of the group Owner");
        }

        Role role = roleRepository.findByName(newRoleName)
                .orElseThrow(() -> new RuntimeException("Role not found: " + newRoleName));
        target.setRole(role);
        groupMemberRepository.save(target);
        log.info("User {} role updated to {} in group {} by owner {}", targetUserId, newRoleName, groupId, currentUserId);

        String groupName = target.getGroup().getDisplayName();
        String actorUser = userRepository.findById(currentUserId)
                .map(u -> u.getFirstName() + " " + u.getLastName()).orElse("An owner");
        notificationService.notifyUser(
                new NotificationRequest(
                        targetUserId,
                        NotificationType.ROLE_CHANGED,
                        "Your role was updated",
                        String.format("Your role in group '%s' has been changed to %s by %s.", groupName, newRoleName, actorUser),
                        groupId,
                        null,
                        actorUser
                )
        );
    }

    @Transactional
    public void updateDefaultMemberRole(Long groupId, String roleName) {
        Long currentUserId = AuthUtil.getCurrentUserId();
        validateOwnerAccess(currentUserId, groupId);

        if (!"ADMIN".equals(roleName) && !"MEMBER".equals(roleName) && !"VIEWER".equals(roleName)) {
            throw new BadRequestException("Default member role must be ADMIN, MEMBER, or VIEWER");
        }

        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new BadRequestException("Group not found"));

        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
        group.setDefaultMemberRole(role);
        groupRepository.save(group);
        log.info("Default member role for group {} updated to {} by owner {}", groupId, roleName, currentUserId);
    }

    private void notifyAdminsAndOwners(Long groupId, NotificationRequest template) {
        notifyAdminsAndOwners(groupId, template, null);
    }

    private void notifyAdminsAndOwners(Long groupId, NotificationRequest template, Long excludeUserId) {
        java.util.List<GroupMember> privileged = new java.util.ArrayList<>();
        privileged.addAll(groupMemberRepository.findByGroupIdAndRole_Name(groupId, "ADMIN"));
        privileged.addAll(groupMemberRepository.findByGroupIdAndRole_Name(groupId, "OWNER"));
        privileged.stream()
                .filter(m -> excludeUserId == null || !m.getUser().getId().equals(excludeUserId))
                .forEach(m -> {
                    NotificationRequest req = new NotificationRequest(
                            m.getUser().getId(),
                            template.getType(),
                            template.getTitle(),
                            template.getMessage(),
                            template.getGroupId(),
                            template.getSectionId(),
                            template.getActorName()
                    );
                    req.setActorId(template.getActorId());
                    notificationService.notifyUser(req);
                });
    }
}
