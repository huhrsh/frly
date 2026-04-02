package com.example.frly.group;

import com.example.frly.auth.JwtUserPrincipal;
import com.example.frly.common.Role;
import com.example.frly.common.RoleRepository;
import com.example.frly.common.enums.RecordStatus;
import com.example.frly.common.exception.BadRequestException;
import com.example.frly.email.EmailService;
import com.example.frly.group.dto.CreateGroupInviteRequestDto;
import com.example.frly.group.enums.GroupInviteStatus;
import com.example.frly.group.enums.GroupMemberStatus;
import com.example.frly.group.mapper.GroupInviteMapper;
import com.example.frly.group.model.Group;
import com.example.frly.group.model.GroupInviteToken;
import com.example.frly.group.model.GroupMember;
import com.example.frly.group.repository.GroupInviteTokenRepository;
import com.example.frly.group.repository.GroupMemberRepository;
import com.example.frly.group.repository.GroupRepository;
import com.example.frly.group.service.GroupInviteService;
import com.example.frly.notification.NotificationService;
import com.example.frly.user.User;
import com.example.frly.user.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GroupInviteServiceTest {

    @Mock private GroupInviteTokenRepository inviteRepository;
    @Mock private GroupRepository groupRepository;
    @Mock private GroupMemberRepository groupMemberRepository;
    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private EmailService emailService;
    @Mock private GroupInviteMapper groupInviteMapper;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private GroupInviteService groupInviteService;

    private static final Long USER_ID = 10L;
    private static final Long GROUP_ID = 1L;
    private static final String TEMPLATE =
        "Hi {{FIRST_NAME}}, join {{GROUP_NAME}} invited by {{INVITER_NAME}}: {{INVITE_ACCEPT_LINK}} / {{INVITE_DECLINE_LINK}}";

    @BeforeEach
    void setUp() {
        JwtUserPrincipal principal = new JwtUserPrincipal(USER_ID, "admin@example.com");
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(principal, null, Collections.emptyList())
        );
        ReflectionTestUtils.setField(groupInviteService, "frontendBaseUrl", "http://localhost:3000/");
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    // ─── sendInvite ───────────────────────────────────────────────────────────

    @Test
    void sendInvite_withNullEmail_throwsBadRequest() {
        CreateGroupInviteRequestDto req = new CreateGroupInviteRequestDto();
        req.setEmail(null);

        assertThrows(BadRequestException.class, () -> groupInviteService.sendInvite(GROUP_ID, req));
        verify(groupRepository, never()).findById(any());
    }

    @Test
    void sendInvite_withBlankEmail_throwsBadRequest() {
        CreateGroupInviteRequestDto req = new CreateGroupInviteRequestDto();
        req.setEmail("   ");

        assertThrows(BadRequestException.class, () -> groupInviteService.sendInvite(GROUP_ID, req));
    }

    @Test
    void sendInvite_withInactiveGroup_throwsBadRequest() {
        Group group = buildGroup(GROUP_ID, "My Group");
        group.setStatus(RecordStatus.DELETED);
        when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));

        CreateGroupInviteRequestDto req = new CreateGroupInviteRequestDto();
        req.setEmail("bob@example.com");

        assertThrows(BadRequestException.class, () -> groupInviteService.sendInvite(GROUP_ID, req));
    }

    @Test
    void sendInvite_whenSenderIsNotAdmin_throwsBadRequest() {
        Group group = buildGroup(GROUP_ID, "My Group");
        User sender = buildUser(USER_ID, "Alice");

        Role memberRole = new Role();
        memberRole.setName("MEMBER"); // not ADMIN
        GroupMember senderMembership = buildMember(sender, group, memberRole);

        when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));
        when(groupMemberRepository.findByUserIdAndGroupId(USER_ID, GROUP_ID))
            .thenReturn(Optional.of(senderMembership));

        CreateGroupInviteRequestDto req = new CreateGroupInviteRequestDto();
        req.setEmail("bob@example.com");

        assertThrows(BadRequestException.class, () -> groupInviteService.sendInvite(GROUP_ID, req));
    }

    @Test
    void sendInvite_whenInviteeHasNoAccount_throwsBadRequest() {
        Group group = buildGroup(GROUP_ID, "My Group");
        User sender = buildUser(USER_ID, "Alice");
        GroupMember senderMembership = buildAdminMember(sender, group);

        when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));
        when(groupMemberRepository.findByUserIdAndGroupId(USER_ID, GROUP_ID))
            .thenReturn(Optional.of(senderMembership));
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        CreateGroupInviteRequestDto req = new CreateGroupInviteRequestDto();
        req.setEmail("unknown@example.com");

        assertThrows(BadRequestException.class, () -> groupInviteService.sendInvite(GROUP_ID, req));
    }

    @Test
    void sendInvite_success_savesTokenAndSendsEmail() {
        Group group = buildGroup(GROUP_ID, "My Group");
        User sender = buildUser(USER_ID, "Alice");
        User invitee = buildUser(2L, "Bob");
        GroupMember senderMembership = buildAdminMember(sender, group);

        when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));
        when(groupMemberRepository.findByUserIdAndGroupId(USER_ID, GROUP_ID))
            .thenReturn(Optional.of(senderMembership));
        when(userRepository.findByEmail("bob@example.com")).thenReturn(Optional.of(invitee));
        when(groupMemberRepository.findByUserIdAndGroupId(2L, GROUP_ID)).thenReturn(Optional.empty());
        when(inviteRepository.findByGroupIdAndUserIdAndStatus(GROUP_ID, 2L, GroupInviteStatus.PENDING))
            .thenReturn(Collections.emptyList());
        when(inviteRepository.save(any(GroupInviteToken.class))).thenReturn(buildInviteToken(1L, invitee, group));
        when(emailService.loadTemplate("email/group-invite.html")).thenReturn(TEMPLATE);

        CreateGroupInviteRequestDto req = new CreateGroupInviteRequestDto();
        req.setEmail("bob@example.com");

        assertDoesNotThrow(() -> groupInviteService.sendInvite(GROUP_ID, req));

        verify(inviteRepository).save(any(GroupInviteToken.class));
        verify(emailService).sendHtml(eq("bob@example.com"), any(), any());
    }

    // ─── acceptInvite / declineInvite (token-based) ───────────────────────────

    @Test
    void acceptInvite_validToken_setsInviteAcceptedAndMemberApproved() {
        Group group = buildGroup(GROUP_ID, "My Group");
        User user = buildUser(USER_ID, "Alice");
        GroupInviteToken invite = buildInviteToken(1L, user, group);

        Role memberRole = new Role();
        memberRole.setName("MEMBER");

        when(inviteRepository.findFirstByTokenHashAndStatusAndExpiresAtAfter(any(), eq(GroupInviteStatus.PENDING), any()))
            .thenReturn(Optional.of(invite));
        when(groupMemberRepository.findByUserIdAndGroupId(USER_ID, GROUP_ID)).thenReturn(Optional.empty());
        when(roleRepository.findByName("MEMBER")).thenReturn(Optional.of(memberRole));
        when(groupMemberRepository.save(any(GroupMember.class))).thenAnswer(i -> i.getArguments()[0]);
        when(inviteRepository.findByGroupIdAndUserIdAndStatus(GROUP_ID, USER_ID, GroupInviteStatus.PENDING))
            .thenReturn(Collections.emptyList());

        groupInviteService.acceptInvite("any-raw-token");

        assertEquals(GroupInviteStatus.ACCEPTED, invite.getStatus());
        verify(groupMemberRepository).save(argThat(m -> m.getStatus() == GroupMemberStatus.APPROVED));
    }

    @Test
    void declineInvite_validToken_setsInviteDeclined() {
        Group group = buildGroup(GROUP_ID, "My Group");
        User user = buildUser(USER_ID, "Alice");
        GroupInviteToken invite = buildInviteToken(1L, user, group);

        when(inviteRepository.findFirstByTokenHashAndStatusAndExpiresAtAfter(any(), eq(GroupInviteStatus.PENDING), any()))
            .thenReturn(Optional.of(invite));

        groupInviteService.declineInvite("any-raw-token");

        assertEquals(GroupInviteStatus.DECLINED, invite.getStatus());
        verify(inviteRepository).save(invite);
    }

    @Test
    void acceptInvite_withBlankToken_throwsBadRequest() {
        assertThrows(BadRequestException.class, () -> groupInviteService.acceptInvite(""));
    }

    @Test
    void declineInvite_withExpiredToken_throwsBadRequest() {
        when(inviteRepository.findFirstByTokenHashAndStatusAndExpiresAtAfter(any(), any(), any()))
            .thenReturn(Optional.empty());

        assertThrows(BadRequestException.class, () -> groupInviteService.declineInvite("expired-token"));
    }

    // ─── acceptInviteById / declineInviteById ────────────────────────────────

    @Test
    void acceptInviteById_success_setsMemberApprovedAndInviteAccepted() {
        Group group = buildGroup(GROUP_ID, "My Group");
        User user = buildUser(USER_ID, "Alice");
        GroupInviteToken invite = buildInviteToken(1L, user, group);

        Role memberRole = new Role();
        memberRole.setName("MEMBER");

        when(inviteRepository.findById(1L)).thenReturn(Optional.of(invite));
        when(groupMemberRepository.findByUserIdAndGroupId(USER_ID, GROUP_ID)).thenReturn(Optional.empty());
        when(roleRepository.findByName("MEMBER")).thenReturn(Optional.of(memberRole));
        when(groupMemberRepository.save(any(GroupMember.class))).thenAnswer(i -> i.getArguments()[0]);
        when(inviteRepository.findByGroupIdAndUserIdAndStatus(GROUP_ID, USER_ID, GroupInviteStatus.PENDING))
            .thenReturn(Collections.emptyList());

        groupInviteService.acceptInviteById(1L, USER_ID);

        assertEquals(GroupInviteStatus.ACCEPTED, invite.getStatus());
        verify(groupMemberRepository).save(argThat(m -> m.getStatus() == GroupMemberStatus.APPROVED));
    }

    @Test
    void acceptInviteById_whenInviteDoesNotBelongToUser_throwsBadRequest() {
        Group group = buildGroup(GROUP_ID, "My Group");
        User otherUser = buildUser(99L, "Other");
        GroupInviteToken invite = buildInviteToken(1L, otherUser, group); // belongs to user 99

        when(inviteRepository.findById(1L)).thenReturn(Optional.of(invite));

        assertThrows(BadRequestException.class,
            () -> groupInviteService.acceptInviteById(1L, USER_ID)); // current user is 10
    }

    @Test
    void acceptInviteById_whenInviteExpired_throwsBadRequest() {
        Group group = buildGroup(GROUP_ID, "My Group");
        User user = buildUser(USER_ID, "Alice");
        GroupInviteToken invite = buildInviteToken(1L, user, group);
        invite.setExpiresAt(Instant.now().minusSeconds(3600)); // already expired

        when(inviteRepository.findById(1L)).thenReturn(Optional.of(invite));

        assertThrows(BadRequestException.class, () -> groupInviteService.acceptInviteById(1L, USER_ID));
    }

    @Test
    void declineInviteById_whenNotOwner_throwsBadRequest() {
        Group group = buildGroup(GROUP_ID, "My Group");
        User otherUser = buildUser(99L, "Other");
        GroupInviteToken invite = buildInviteToken(1L, otherUser, group);

        when(inviteRepository.findById(1L)).thenReturn(Optional.of(invite));

        assertThrows(BadRequestException.class,
            () -> groupInviteService.declineInviteById(1L, USER_ID));
    }

    @Test
    void declineInviteById_success_setsInviteDeclined() {
        Group group = buildGroup(GROUP_ID, "My Group");
        User user = buildUser(USER_ID, "Alice");
        GroupInviteToken invite = buildInviteToken(1L, user, group);

        when(inviteRepository.findById(1L)).thenReturn(Optional.of(invite));

        groupInviteService.declineInviteById(1L, USER_ID);

        assertEquals(GroupInviteStatus.DECLINED, invite.getStatus());
        verify(inviteRepository).save(invite);
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private User buildUser(Long id, String firstName) {
        User u = new User();
        u.setId(id);
        u.setFirstName(firstName);
        u.setLastName("User");
        u.setEmail(firstName.toLowerCase() + "@example.com");
        return u;
    }

    private Group buildGroup(Long id, String displayName) {
        Group g = new Group();
        g.setId(id);
        g.setDisplayName(displayName);
        g.setStatus(RecordStatus.ACTIVE);
        return g;
    }

    private GroupMember buildMember(User user, Group group, Role role) {
        GroupMember m = new GroupMember();
        m.setUser(user);
        m.setGroup(group);
        m.setRole(role);
        m.setStatus(GroupMemberStatus.APPROVED);
        return m;
    }

    private GroupMember buildAdminMember(User user, Group group) {
        Role adminRole = new Role();
        adminRole.setName("ADMIN");
        return buildMember(user, group, adminRole);
    }

    private GroupInviteToken buildInviteToken(Long id, User user, Group group) {
        GroupInviteToken t = new GroupInviteToken();
        t.setId(id);
        t.setUser(user);
        t.setGroup(group);
        t.setEmail(user.getEmail());
        t.setStatus(GroupInviteStatus.PENDING);
        t.setExpiresAt(Instant.now().plusSeconds(86400)); // 1 day from now
        return t;
    }
}
