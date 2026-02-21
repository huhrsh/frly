package com.example.frly.group.service;

import com.example.frly.group.dto.CreateGroupRequestDto;
import com.example.frly.group.dto.GroupResponseDto;
import com.example.frly.group.dto.GroupMemberSimpleDto;
import com.example.frly.group.dto.UpdateViewPreferenceRequestDto;
import com.example.frly.group.enums.GroupViewPreference;
import com.example.frly.group.dto.JoinGroupRequestDto;
import com.example.frly.group.dto.GroupJoinRequestDto;
import com.example.frly.auth.AuthUtil;
import com.example.frly.common.Role;
import com.example.frly.common.RoleRepository;
import com.example.frly.group.enums.GroupMemberStatus;
import com.example.frly.user.User;
import com.example.frly.user.UserRepository;
import com.example.frly.group.repository.GroupRepository;
import com.example.frly.group.repository.GroupMemberRepository;
import com.example.frly.group.model.Group;
import com.example.frly.group.model.GroupMember;
import com.example.frly.group.GroupContext;
import com.example.frly.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import com.example.frly.common.exception.BadRequestException;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

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
    private static final String CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
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
        group.setStatus("ACTIVE");
        group.setCreatedAt(LocalDateTime.now());

        // Generate simple 8-char invite code
        String inviteCode = generateInviteCode();
        group.setInviteCode(inviteCode);

        group = groupRepository.save(group);

        // 2. Assign ADMIN Role
        Role adminRole = roleRepository.findByName("ADMIN")
                .orElseThrow(() -> new RuntimeException("Error: Role 'ADMIN' is not found."));

        GroupMember groupMember = new GroupMember();
        groupMember.setGroup(group);
        groupMember.setUser(user);
        groupMember.setRole(adminRole);
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

        if (groupMemberRepository.existsByUserIdAndGroupId(userId, group.getId())) {
            throw new BadRequestException("You are already a member or have a pending request");
        }

        Role memberRole = roleRepository.findByName("MEMBER")
                .orElseThrow(() -> new RuntimeException("Error: Role 'MEMBER' is not found."));

        GroupMember groupMember = new GroupMember();
        groupMember.setGroup(group);
        groupMember.setUser(user);
        groupMember.setRole(memberRole);
        groupMember.setStatus(GroupMemberStatus.PENDING);

        groupMemberRepository.save(groupMember);
        log.info("User {} requested to join Group {}", userId, group.getId());

        // Notify all admins of this group about the join request
        groupMemberRepository.findByGroupIdAndRole_Name(group.getId(), "ADMIN")
            .forEach(adminMember -> notificationService.notifyUser(
                adminMember.getUser().getId(),
                "GROUP_JOIN_REQUEST",
                String.format("%s %s requested to join group '%s'",
                    user.getFirstName(),
                    user.getLastName(),
                    group.getDisplayName())
            ));

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

        // Notify the user that their request was approved
        notificationService.notifyUser(
            memberToApprove.getUser().getId(),
            "GROUP_JOIN_APPROVED",
            String.format("Your request to join group '%s' has been approved.",
                memberToApprove.getGroup().getDisplayName())
        );
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
                  dto.setMembershipStatus(member.getStatus().name());
                  if (member.getViewPreference() != null) {
                      dto.setViewPreference(member.getViewPreference().name());
                  }
               });

           // For admins, expose how many pending members are waiting
           long pendingCount = groupMemberRepository.countByGroupIdAndStatus(groupId, GroupMemberStatus.PENDING);
           dto.setPendingMemberCount(pendingCount);

        return dto;
    }

    public java.util.List<com.example.frly.group.dto.GroupResponseDto> getUserGroups(Long userId) {
        return groupMemberRepository.findByUserId(userId).stream()
                .map(member -> {
                    Group group = member.getGroup();
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
                    dto.setMembershipStatus(member.getStatus().name());

                    if (member.getViewPreference() != null) {
                        dto.setViewPreference(member.getViewPreference().name());
                    }

                    long pendingCount = groupMemberRepository.countByGroupIdAndStatus(group.getId(), GroupMemberStatus.PENDING);
                    dto.setPendingMemberCount(pendingCount);
                    return dto;
                })
                .collect(java.util.stream.Collectors.toList());
    }


    public void updateViewPreference(Long userId, Long groupId, UpdateViewPreferenceRequestDto request) {
        if (request == null || request.getViewPreference() == null) {
            throw new BadRequestException("viewPreference is required");
        }

        GroupViewPreference preference;
        try {
            preference = GroupViewPreference.valueOf(request.getViewPreference().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid viewPreference value");
        }

        GroupMember member = groupMemberRepository.findByUserIdAndGroupId(userId, groupId)
                .orElseThrow(() -> new BadRequestException("Access Denied: You are not a member of this group"));

        member.setViewPreference(preference);
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
            boolean exists = groupMemberRepository.existsByUserIdAndGroupId(userId, groupId);
            if (!exists) {
                log.warn("{}, User: {}, Group: {}", SECURITY_ALERT_NO_ACCESS, userId, groupId);
                throw new BadRequestException("Access Denied: You are not a member of this group");
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
                    dto.setStatus(member.getStatus().name());
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
                    return dto;
                })
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional(readOnly = true)
    private void validateAdminAccess(Long userId, Long groupId) {
        var memberOpt = groupMemberRepository.findByUserIdAndGroupId(userId, groupId);
        GroupMember member = memberOpt.orElseThrow(() -> new BadRequestException("Access Denied: You are not a member of this group"));

        if (member.getRole() == null || member.getRole().getName() == null || !"ADMIN".equals(member.getRole().getName())) {
            log.warn("SECURITY ALERT: Non-admin user {} attempted admin operation on group {}", userId, groupId);
            throw new BadRequestException("Access Denied: Admins only");
        }
    }
}
