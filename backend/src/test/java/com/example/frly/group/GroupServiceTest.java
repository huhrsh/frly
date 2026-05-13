package com.example.frly.group;

import com.example.frly.auth.JwtUserPrincipal;
import com.example.frly.common.Role;
import com.example.frly.common.RoleRepository;
import com.example.frly.common.enums.RecordStatus;
import com.example.frly.common.exception.BadRequestException;
import com.example.frly.group.dto.CreateGroupRequestDto;
import com.example.frly.group.dto.JoinGroupRequestDto;
import com.example.frly.group.enums.GroupMemberStatus;
import com.example.frly.group.model.Group;
import com.example.frly.group.model.GroupMember;
import com.example.frly.group.repository.GroupMemberRepository;
import com.example.frly.group.repository.GroupRepository;
import com.example.frly.group.service.GroupService;
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

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GroupServiceTest {

    @Mock private GroupRepository groupRepository;
    @Mock private GroupMemberRepository groupMemberRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private UserRepository userRepository;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private GroupService groupService;

    private static final Long USER_ID = 10L;

    @BeforeEach
    void setUpSecurityContext() {
        JwtUserPrincipal principal = new JwtUserPrincipal(USER_ID, "user@example.com");
        UsernamePasswordAuthenticationToken auth =
            new UsernamePasswordAuthenticationToken(principal, null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        GroupContext.clear();
    }

    // ─── createGroup ─────────────────────────────────────────────────────────

    @Test
    void createGroup_savesGroupAndAdminMembership() {
        CreateGroupRequestDto request = new CreateGroupRequestDto();
        request.setDisplayName("Flat Mates");

        User user = buildUser(USER_ID);
        Group savedGroup = buildGroup(1L, "Flat Mates", RecordStatus.ACTIVE);
        Role ownerRole = buildRole("OWNER");
        Role memberRole = buildRole("MEMBER");

        when(userRepository.getReferenceById(USER_ID)).thenReturn(user);
        when(groupRepository.existsByInviteCode(anyString())).thenReturn(false);
        when(groupRepository.save(any(Group.class))).thenReturn(savedGroup);
        when(roleRepository.findByName("OWNER")).thenReturn(Optional.of(ownerRole));
        when(roleRepository.findByName("MEMBER")).thenReturn(Optional.of(memberRole));

        Long result = groupService.createGroup(request);

        assertEquals(1L, result);
        verify(groupMemberRepository).save(argThat(member ->
            member.getStatus() == GroupMemberStatus.APPROVED &&
            member.getRole().getName().equals("OWNER")
        ));
    }

    @Test
    void createGroup_whenOwnerRoleMissing_throwsRuntimeException() {
        CreateGroupRequestDto request = new CreateGroupRequestDto();
        request.setDisplayName("Flat Mates");

        when(userRepository.getReferenceById(USER_ID)).thenReturn(buildUser(USER_ID));
        when(groupRepository.existsByInviteCode(anyString())).thenReturn(false);
        when(roleRepository.findByName("OWNER")).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> groupService.createGroup(request));
    }

    // ─── joinGroup ───────────────────────────────────────────────────────────

    @Test
    void joinGroup_withValidCode_createsPendingMembership() {
        JoinGroupRequestDto request = new JoinGroupRequestDto();
        request.setInviteCode("VALIDCOD");

        Group group = buildGroup(5L, "My Group", RecordStatus.ACTIVE);
        Role memberRole = buildRole("MEMBER");

        when(userRepository.getReferenceById(USER_ID)).thenReturn(buildUser(USER_ID));
        when(groupRepository.findByInviteCode("VALIDCOD")).thenReturn(Optional.of(group));
        when(groupMemberRepository.findByUserIdAndGroupId(USER_ID, 5L)).thenReturn(Optional.empty());
        when(roleRepository.findByName("MEMBER")).thenReturn(Optional.of(memberRole));
        when(groupMemberRepository.findByGroupIdAndRole_Name(5L, "ADMIN"))
            .thenReturn(Collections.emptyList());

        Long result = groupService.joinGroup(request);

        assertEquals(5L, result);
        verify(groupMemberRepository).save(argThat(m -> m.getStatus() == GroupMemberStatus.PENDING));
    }

    @Test
    void joinGroup_withInvalidCode_throwsBadRequestException() {
        JoinGroupRequestDto request = new JoinGroupRequestDto();
        request.setInviteCode("BADCODE1");

        when(userRepository.getReferenceById(USER_ID)).thenReturn(buildUser(USER_ID));
        when(groupRepository.findByInviteCode("BADCODE1")).thenReturn(Optional.empty());

        assertThrows(BadRequestException.class, () -> groupService.joinGroup(request));
    }

    @Test
    void joinGroup_whenGroupIsDeleted_throwsBadRequestException() {
        JoinGroupRequestDto request = new JoinGroupRequestDto();
        request.setInviteCode("DELETED1");

        Group deletedGroup = buildGroup(5L, "Gone", RecordStatus.DELETED);
        when(userRepository.getReferenceById(USER_ID)).thenReturn(buildUser(USER_ID));
        when(groupRepository.findByInviteCode("DELETED1")).thenReturn(Optional.of(deletedGroup));

        assertThrows(BadRequestException.class, () -> groupService.joinGroup(request));
    }

    @Test
    void joinGroup_whenAlreadyMemberWithApprovedStatus_throwsBadRequestException() {
        JoinGroupRequestDto request = new JoinGroupRequestDto();
        request.setInviteCode("VALIDCOD");

        Group group = buildGroup(5L, "My Group", RecordStatus.ACTIVE);
        GroupMember existing = buildMember(buildUser(USER_ID), group, "MEMBER", GroupMemberStatus.APPROVED);

        when(userRepository.getReferenceById(USER_ID)).thenReturn(buildUser(USER_ID));
        when(groupRepository.findByInviteCode("VALIDCOD")).thenReturn(Optional.of(group));
        when(groupMemberRepository.findByUserIdAndGroupId(USER_ID, 5L)).thenReturn(Optional.of(existing));

        assertThrows(BadRequestException.class, () -> groupService.joinGroup(request));
    }

    @Test
    void joinGroup_whenRemovedMember_changesStatusToPending() {
        JoinGroupRequestDto request = new JoinGroupRequestDto();
        request.setInviteCode("VALIDCOD");

        User user = buildUser(USER_ID);
        user.setFirstName("John");
        user.setLastName("Doe");
        Group group = buildGroup(5L, "My Group", RecordStatus.ACTIVE);
        GroupMember removed = buildMember(user, group, "MEMBER", GroupMemberStatus.REMOVED);

        when(userRepository.getReferenceById(USER_ID)).thenReturn(user);
        when(groupRepository.findByInviteCode("VALIDCOD")).thenReturn(Optional.of(group));
        when(groupMemberRepository.findByUserIdAndGroupId(USER_ID, 5L)).thenReturn(Optional.of(removed));
        when(groupMemberRepository.findByGroupIdAndRole_Name(5L, "ADMIN"))
            .thenReturn(Collections.emptyList());

        groupService.joinGroup(request);

        assertEquals(GroupMemberStatus.PENDING, removed.getStatus());
        verify(groupMemberRepository).save(removed);
    }

    // ─── validateGroupAccess ─────────────────────────────────────────────────

    @Test
    void validateGroupAccess_withApprovedMembership_passes() {
        Group group = buildGroup(1L, "Active", RecordStatus.ACTIVE);
        GroupMember member = buildMember(buildUser(USER_ID), group, "MEMBER", GroupMemberStatus.APPROVED);

        when(groupMemberRepository.findByUserIdAndGroupId(USER_ID, 1L))
            .thenReturn(Optional.of(member));

        assertDoesNotThrow(() -> groupService.validateGroupAccess(USER_ID, "1"));
    }

    @Test
    void validateGroupAccess_whenNotMember_throwsBadRequestException() {
        when(groupMemberRepository.findByUserIdAndGroupId(USER_ID, 1L))
            .thenReturn(Optional.empty());

        assertThrows(BadRequestException.class,
            () -> groupService.validateGroupAccess(USER_ID, "1"));
    }

    @Test
    void validateGroupAccess_whenMembershipIsPending_throwsBadRequestException() {
        Group group = buildGroup(1L, "Active", RecordStatus.ACTIVE);
        GroupMember member = buildMember(buildUser(USER_ID), group, "MEMBER", GroupMemberStatus.PENDING);

        when(groupMemberRepository.findByUserIdAndGroupId(USER_ID, 1L))
            .thenReturn(Optional.of(member));

        assertThrows(BadRequestException.class,
            () -> groupService.validateGroupAccess(USER_ID, "1"));
    }

    @Test
    void validateGroupAccess_whenGroupIsDeleted_throwsBadRequestException() {
        Group deletedGroup = buildGroup(1L, "Deleted", RecordStatus.DELETED);
        GroupMember member = buildMember(buildUser(USER_ID), deletedGroup, "MEMBER", GroupMemberStatus.APPROVED);

        when(groupMemberRepository.findByUserIdAndGroupId(USER_ID, 1L))
            .thenReturn(Optional.of(member));

        assertThrows(BadRequestException.class,
            () -> groupService.validateGroupAccess(USER_ID, "1"));
    }

    @Test
    void validateGroupAccess_withNullGroupId_throwsBadRequestException() {
        assertThrows(BadRequestException.class,
            () -> groupService.validateGroupAccess(USER_ID, null));
    }

    @Test
    void validateGroupAccess_withZeroGroupId_throwsBadRequestException() {
        assertThrows(BadRequestException.class,
            () -> groupService.validateGroupAccess(USER_ID, "0"));
    }

    // ─── deleteGroup ─────────────────────────────────────────────────────────

    @Test
    void deleteGroup_softDeletesGroupForOwner() {
        Group group = buildGroup(1L, "My Group", RecordStatus.ACTIVE);
        GroupMember ownerMember = buildMember(buildUser(USER_ID), group, "OWNER", GroupMemberStatus.APPROVED);

        when(groupMemberRepository.findByUserIdAndGroupId(USER_ID, 1L))
            .thenReturn(Optional.of(ownerMember));
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));

        groupService.deleteGroup(1L);

        assertEquals(RecordStatus.DELETED, group.getStatus());
        verify(groupRepository).save(group);
    }

    @Test
    void deleteGroup_asAdmin_throwsAccessDenied() {
        Group group = buildGroup(1L, "My Group", RecordStatus.ACTIVE);
        GroupMember adminMember = buildMember(buildUser(USER_ID), group, "ADMIN", GroupMemberStatus.APPROVED);

        when(groupMemberRepository.findByUserIdAndGroupId(USER_ID, 1L))
            .thenReturn(Optional.of(adminMember));

        assertThrows(BadRequestException.class, () -> groupService.deleteGroup(1L));
    }

    @Test
    void deleteGroup_whenGroupNotFound_throwsBadRequestException() {
        Group group = buildGroup(1L, "My Group", RecordStatus.ACTIVE);
        GroupMember ownerMember = buildMember(buildUser(USER_ID), group, "OWNER", GroupMemberStatus.APPROVED);

        when(groupMemberRepository.findByUserIdAndGroupId(USER_ID, 1L))
            .thenReturn(Optional.of(ownerMember));
        when(groupRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(BadRequestException.class, () -> groupService.deleteGroup(1L));
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private User buildUser(Long id) {
        User u = new User();
        u.setId(id);
        u.setFirstName("Test");
        u.setLastName("User");
        u.setEmail("user@example.com");
        u.setEncryptedPassword("hashed");
        return u;
    }

    private Group buildGroup(Long id, String displayName, RecordStatus status) {
        Group g = new Group();
        g.setId(id);
        g.setDisplayName(displayName);
        g.setStatus(status);
        g.setInviteCode("TESTCODE");
        return g;
    }

    private Role buildRole(String name) {
        Role r = new Role();
        r.setName(name);
        return r;
    }

    private GroupMember buildMember(User user, Group group, String roleName, GroupMemberStatus status) {
        GroupMember m = new GroupMember();
        m.setUser(user);
        m.setGroup(group);
        m.setRole(buildRole(roleName));
        m.setStatus(status);
        return m;
    }
}
