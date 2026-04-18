package com.example.frly.activity;

import com.example.frly.auth.JwtUserPrincipal;
import com.example.frly.group.enums.GroupMemberStatus;
import com.example.frly.group.model.Group;
import com.example.frly.group.model.GroupMember;
import com.example.frly.group.repository.GroupMemberRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ActivityLogServiceTest {

    @Mock private ActivityLogRepository activityLogRepository;
    @Mock private GroupMemberRepository groupMemberRepository;

    @InjectMocks
    private ActivityLogService activityLogService;

    private static final Long USER_ID = 42L;

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
    }

    // ─── log() ───────────────────────────────────────────────────────────────

    @Test
    void log_savesActivityEntryWithCorrectFields() {
        activityLogService.log("group-1", USER_ID, "Alice Smith", null,
                ActivityType.EXPENSE_ADDED, "Groceries", 5L, "Payments");

        verify(activityLogRepository).save(argThat(entry ->
                "group-1".equals(entry.getGroupId()) &&
                USER_ID.equals(entry.getActorId()) &&
                "Alice Smith".equals(entry.getActorName()) &&
                ActivityType.EXPENSE_ADDED.equals(entry.getActionType()) &&
                "Groceries".equals(entry.getEntityName()) &&
                Long.valueOf(5L).equals(entry.getSectionId()) &&
                "Payments".equals(entry.getSectionName())
        ));
    }

    @Test
    void log_withNullOptionalFields_savesSuccessfully() {
        activityLogService.log("group-1", USER_ID, "Bob", null, ActivityType.MEMBER_JOINED, null, null, null);

        verify(activityLogRepository).save(argThat(entry ->
                ActivityType.MEMBER_JOINED.equals(entry.getActionType()) &&
                entry.getEntityName() == null &&
                entry.getSectionId() == null
        ));
    }

    @Test
    void log_swallowsRepositoryException() {
        when(activityLogRepository.save(any())).thenThrow(new RuntimeException("DB down"));

        assertDoesNotThrow(() ->
                activityLogService.log("g1", USER_ID, "Alice", null, ActivityType.NOTE_UPDATED, "Note", null, "Notes"));
    }

    // ─── getGroupActivity() ───────────────────────────────────────────────────

    @Test
    void getGroupActivity_returnsPagedAndMappedResults() {
        ActivityLog entry = buildLog("group-1", USER_ID, ActivityType.ITEM_ADDED, "Milk");
        when(activityLogRepository.findByGroupIdOrderByCreatedAtDesc(eq("group-1"), any(PageRequest.class)))
                .thenReturn(List.of(entry));

        List<ActivityLogDto> result = activityLogService.getGroupActivity("group-1", 0, 20);

        assertEquals(1, result.size());
        assertEquals("group-1", result.get(0).getGroupId());
        assertEquals(ActivityType.ITEM_ADDED, result.get(0).getActionType());
        assertEquals("Milk", result.get(0).getEntityName());
    }

    @Test
    void getGroupActivity_returnsEmptyListWhenNoEntries() {
        when(activityLogRepository.findByGroupIdOrderByCreatedAtDesc(anyString(), any()))
                .thenReturn(List.of());

        List<ActivityLogDto> result = activityLogService.getGroupActivity("group-1", 0, 20);

        assertTrue(result.isEmpty());
    }

    @Test
    void getGroupActivity_passesCorrectPageToRepository() {
        when(activityLogRepository.findByGroupIdOrderByCreatedAtDesc(anyString(), any()))
                .thenReturn(List.of());

        activityLogService.getGroupActivity("g1", 2, 10);

        verify(activityLogRepository).findByGroupIdOrderByCreatedAtDesc(
                eq("g1"), eq(PageRequest.of(2, 10)));
    }

    // ─── getRecentForCurrentUser() ────────────────────────────────────────────

    @Test
    void getRecentForCurrentUser_returnsEmptyWhenUserHasNoGroups() {
        when(groupMemberRepository.findByUserId(USER_ID)).thenReturn(List.of());

        List<ActivityLogDto> result = activityLogService.getRecentForCurrentUser(0, 15);

        assertTrue(result.isEmpty());
        verifyNoInteractions(activityLogRepository);
    }

    @Test
    void getRecentForCurrentUser_excludesPendingMemberships() {
        GroupMember pending = buildMember(GroupMemberStatus.PENDING, 2L);
        when(groupMemberRepository.findByUserId(USER_ID)).thenReturn(List.of(pending));

        List<ActivityLogDto> result = activityLogService.getRecentForCurrentUser(0, 15);

        assertTrue(result.isEmpty());
        verifyNoInteractions(activityLogRepository);
    }

    @Test
    void getRecentForCurrentUser_excludesRemovedMemberships() {
        GroupMember removed = buildMember(GroupMemberStatus.REMOVED, 3L);
        when(groupMemberRepository.findByUserId(USER_ID)).thenReturn(List.of(removed));

        List<ActivityLogDto> result = activityLogService.getRecentForCurrentUser(0, 15);

        assertTrue(result.isEmpty());
        verifyNoInteractions(activityLogRepository);
    }

    @Test
    void getRecentForCurrentUser_queriesApprovedGroupsAndMapsToDto() {
        GroupMember approved = buildMember(GroupMemberStatus.APPROVED, 1L);
        ActivityLog log = buildLog("1", USER_ID, ActivityType.MEMBER_JOINED, null);

        when(groupMemberRepository.findByUserId(USER_ID)).thenReturn(List.of(approved));
        when(activityLogRepository.findByGroupIdInOrderByCreatedAtDesc(eq(List.of("1")), any()))
                .thenReturn(List.of(log));

        List<ActivityLogDto> result = activityLogService.getRecentForCurrentUser(0, 15);

        assertEquals(1, result.size());
        assertEquals(ActivityType.MEMBER_JOINED, result.get(0).getActionType());
    }

    @Test
    void getRecentForCurrentUser_onlyIncludesApprovedAmongMixed() {
        GroupMember approved = buildMember(GroupMemberStatus.APPROVED, 1L);
        GroupMember pending = buildMember(GroupMemberStatus.PENDING, 2L);
        when(groupMemberRepository.findByUserId(USER_ID)).thenReturn(List.of(approved, pending));
        when(activityLogRepository.findByGroupIdInOrderByCreatedAtDesc(any(), any()))
                .thenReturn(List.of());

        activityLogService.getRecentForCurrentUser(0, 15);

        verify(activityLogRepository).findByGroupIdInOrderByCreatedAtDesc(
                eq(List.of("1")), any());
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private ActivityLog buildLog(String groupId, Long actorId, String actionType, String entityName) {
        ActivityLog a = new ActivityLog();
        a.setGroupId(groupId);
        a.setActorId(actorId);
        a.setActorName("Alice");
        a.setActionType(actionType);
        a.setEntityName(entityName);
        return a;
    }

    private GroupMember buildMember(GroupMemberStatus status, Long groupId) {
        Group group = new Group();
        group.setId(groupId);
        group.setDisplayName("Group " + groupId);
        GroupMember m = new GroupMember();
        m.setStatus(status);
        m.setGroup(group);
        return m;
    }
}
