package com.example.frly.group.service;

import com.example.frly.auth.AuthUtil;
import com.example.frly.common.Role;
import com.example.frly.common.RoleRepository;
import com.example.frly.common.enums.RecordStatus;
import com.example.frly.email.EmailService;
import com.example.frly.group.dto.CreateGroupInviteRequestDto;
import com.example.frly.group.dto.GroupInviteSummaryDto;
import com.example.frly.group.enums.GroupInviteStatus;
import com.example.frly.group.enums.GroupMemberStatus;
import com.example.frly.group.mapper.GroupInviteMapper;
import com.example.frly.group.model.Group;
import com.example.frly.group.model.GroupInviteToken;
import com.example.frly.group.model.GroupMember;
import com.example.frly.group.repository.GroupInviteTokenRepository;
import com.example.frly.group.repository.GroupMemberRepository;
import com.example.frly.group.repository.GroupRepository;
import com.example.frly.notification.NotificationRequest;
import com.example.frly.notification.NotificationService;
import com.example.frly.notification.NotificationType;
import com.example.frly.user.User;
import com.example.frly.user.UserRepository;
import com.example.frly.common.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class GroupInviteService {

    private final GroupInviteTokenRepository inviteRepository;
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final EmailService emailService;
    private final GroupInviteMapper groupInviteMapper;
    private final NotificationService notificationService;

    private final SecureRandom random = new SecureRandom();

    @Value("${app.frontend.base-url}")
    private String frontendBaseUrl;

    @Transactional
    public void sendInvite(Long groupId, CreateGroupInviteRequestDto request) {
        if (request == null || request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new BadRequestException("Email is required");
        }

        String email = request.getEmail().trim().toLowerCase();

        Long currentUserId = AuthUtil.getCurrentUserId();
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new BadRequestException("Group not found"));

        if (group.getStatus() != RecordStatus.ACTIVE) {
            throw new BadRequestException("Cannot invite members to an inactive group");
        }

        // Ensure sender is admin of this group
        GroupMember senderMember = groupMemberRepository.findByUserIdAndGroupId(currentUserId, groupId)
                .orElseThrow(() -> new BadRequestException("Access Denied: You are not a member of this group"));
        String senderRole = senderMember.getRole() == null ? null : senderMember.getRole().getName();
        if (!"ADMIN".equals(senderRole) && !"OWNER".equals(senderRole)) {
            throw new BadRequestException("Access Denied: Admins and Owners only");
        }

        User invitee = userRepository.findByEmail(email)
            .orElseThrow(() -> new BadRequestException("No fryly account found for this email. Ask them to sign up first."));

        // Prevent inviting someone who is already in or pending in the group
        groupMemberRepository.findByUserIdAndGroupId(invitee.getId(), groupId).ifPresent(member -> {
            if (member.getStatus() != com.example.frly.group.enums.GroupMemberStatus.REMOVED) {
                throw new BadRequestException("User is already a member or has a pending request");
            }
        });

        // Mark any older pending invites for this user+group as declined so we keep only the latest active
        inviteRepository.findByGroupIdAndUserIdAndStatus(groupId, invitee.getId(), GroupInviteStatus.PENDING)
                .forEach(existing -> {
                    existing.setStatus(GroupInviteStatus.DECLINED);
                    existing.setRespondedAt(Instant.now());
                    inviteRepository.save(existing);
                });

        // Create a fresh token; we keep old ones as history
        String rawToken = generateRandomToken();
        String tokenHash = sha256(rawToken);

        GroupInviteToken invite = new GroupInviteToken();
        invite.setGroup(group);
        invite.setUser(invitee);
        invite.setEmail(invitee.getEmail());
        invite.setTokenHash(tokenHash);
        invite.setExpiresAt(Instant.now().plusSeconds(7 * 24 * 60 * 60)); // 7 days
        inviteRepository.save(invite);

        String base = frontendBaseUrl.replaceAll("/$", "");
        String acceptLink = base + "/group-invite?token=" + rawToken + "&action=accept";
        String declineLink = base + "/group-invite?token=" + rawToken + "&action=decline";

        String subject = "You've been invited to join a fryly group";
        String template = emailService.loadTemplate("email/group-invite.html");

        String inviterName = (senderMember.getUser().getFirstName() + " " + senderMember.getUser().getLastName()).trim();

        String html = template
                .replace("{{FIRST_NAME}}", invitee.getFirstName() != null ? invitee.getFirstName() : "there")
                .replace("{{GROUP_NAME}}", group.getDisplayName())
                .replace("{{INVITER_NAME}}", inviterName.isEmpty() ? "A group admin" : inviterName)
                .replace("{{INVITE_ACCEPT_LINK}}", acceptLink)
                .replace("{{INVITE_DECLINE_LINK}}", declineLink);

        emailService.sendHtml(invitee.getEmail(), subject, html);
        log.info("Sent group invite for group {} to {}", groupId, email);

        // Notify the invited user in-app
        notificationService.notifyUser(
            new NotificationRequest(
                invitee.getId(),
                NotificationType.GROUP_INVITE_RECEIVED,
                "Group invite",
                String.format("%s invited you to join group '%s'", inviterName.isEmpty() ? "An admin" : inviterName, group.getDisplayName()),
                groupId,
                null,
                inviterName.isEmpty() ? "Admin" : inviterName
            )
        );
    }

    @Transactional
    public void acceptInvite(String token) {
        GroupInviteToken invite = resolveActiveInvite(token);

        Group group = invite.getGroup();
        User user = invite.getUser();

        // Find or create membership
        GroupMember member = groupMemberRepository.findByUserIdAndGroupId(user.getId(), group.getId())
                .orElseGet(() -> {
                    Role memberRole = roleRepository.findByName("MEMBER")
                            .orElseThrow(() -> new RuntimeException("Error: Role 'MEMBER' is not found."));

                    GroupMember gm = new GroupMember();
                    gm.setGroup(group);
                    gm.setUser(user);
                    gm.setRole(memberRole);
                    return gm;
                });

        member.setStatus(GroupMemberStatus.APPROVED);
        groupMemberRepository.save(member);

        invite.setStatus(GroupInviteStatus.ACCEPTED);
        invite.setRespondedAt(Instant.now());
        inviteRepository.save(invite);

        // Clean up any other pending invites for the same user+group
        inviteRepository.findByGroupIdAndUserIdAndStatus(group.getId(), user.getId(), GroupInviteStatus.PENDING)
            .forEach(other -> {
                other.setStatus(GroupInviteStatus.DECLINED);
                other.setRespondedAt(Instant.now());
                inviteRepository.save(other);
            });

        log.info("User {} accepted invite to group {}", user.getId(), group.getId());
    }

    @Transactional
    public void declineInvite(String token) {
        GroupInviteToken invite = resolveActiveInvite(token);
        invite.setStatus(GroupInviteStatus.DECLINED);
        invite.setRespondedAt(Instant.now());
        inviteRepository.save(invite);
        log.info("Invite {} declined", invite.getId());
    }

    @Transactional
    public void acceptInviteById(Long inviteId, Long currentUserId) {
        GroupInviteToken invite = inviteRepository.findById(inviteId)
                .orElseThrow(() -> new BadRequestException("Invite not found"));

        if (!invite.getUser().getId().equals(currentUserId)) {
            throw new BadRequestException("Invite does not belong to you");
        }

        if (invite.getStatus() != GroupInviteStatus.PENDING || invite.getExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException("Invite is no longer valid");
        }

        Group group = invite.getGroup();
        User user = invite.getUser();

        GroupMember member = groupMemberRepository.findByUserIdAndGroupId(user.getId(), group.getId())
            .orElseGet(() -> {
                Role memberRole = roleRepository.findByName("MEMBER")
                    .orElseThrow(() -> new RuntimeException("Error: Role 'MEMBER' is not found."));

                GroupMember m = new GroupMember();
                m.setGroup(group);
                m.setUser(user);
                m.setRole(memberRole);
                return m;
            });

        member.setStatus(GroupMemberStatus.APPROVED);
        groupMemberRepository.save(member);

        invite.setStatus(GroupInviteStatus.ACCEPTED);
        invite.setRespondedAt(Instant.now());
        inviteRepository.save(invite);

        // Clean up any other pending invites for the same user+group
        inviteRepository.findByGroupIdAndUserIdAndStatus(group.getId(), user.getId(), GroupInviteStatus.PENDING)
                .forEach(other -> {
                    other.setStatus(GroupInviteStatus.DECLINED);
                    other.setRespondedAt(Instant.now());
                    inviteRepository.save(other);
                });
    }

    @Transactional
    public void declineInviteById(Long inviteId, Long currentUserId) {
        GroupInviteToken invite = inviteRepository.findById(inviteId)
                .orElseThrow(() -> new BadRequestException("Invite not found"));

        if (!invite.getUser().getId().equals(currentUserId)) {
            throw new BadRequestException("Invite does not belong to you");
        }

        if (invite.getStatus() != GroupInviteStatus.PENDING || invite.getExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException("Invite is no longer valid");
        }

        invite.setStatus(GroupInviteStatus.DECLINED);
        invite.setRespondedAt(Instant.now());
        inviteRepository.save(invite);
    }

    @Transactional(readOnly = true)
    public List<GroupInviteSummaryDto> getInvitesForUser(Long userId) {
        // Database-level filtering: only latest invite per group
        return inviteRepository
                .findLatestPendingInvitesPerGroup(userId, GroupInviteStatus.PENDING, Instant.now())
                .stream()
                .map(groupInviteMapper::toGroupInviteSummaryDto)
                .toList();
    }

    private GroupInviteToken resolveActiveInvite(String token) {
        if (token == null || token.isBlank()) {
            throw new BadRequestException("Invite token is required");
        }
        String tokenHash = sha256(token);
        return inviteRepository
                .findFirstByTokenHashAndStatusAndExpiresAtAfter(tokenHash, GroupInviteStatus.PENDING, Instant.now())
                .orElseThrow(() -> new BadRequestException("Invalid or expired invite link"));
    }

    private String generateRandomToken() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                String h = Integer.toHexString(0xff & b);
                if (h.length() == 1) hex.append('0');
                hex.append(h);
            }
            return hex.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to hash token", e);
        }
    }
}
