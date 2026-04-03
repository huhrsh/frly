package com.example.frly.group.controller;

import com.example.frly.group.dto.CreateGroupRequestDto;
import com.example.frly.group.dto.GroupResponseDto;
import com.example.frly.group.dto.GroupJoinRequestDto;
import com.example.frly.group.dto.JoinGroupRequestDto;
import com.example.frly.group.dto.UpdateViewPreferenceRequestDto;
import com.example.frly.group.dto.UpdateGroupRequestDto;
import com.example.frly.group.dto.GroupMemberSimpleDto;
import com.example.frly.group.dto.CreateGroupInviteRequestDto;
import com.example.frly.group.service.GroupService;
import com.example.frly.group.service.GroupInviteService;
import com.example.frly.auth.AuthUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import static com.example.frly.constants.LogConstants.TENANT_CONTROLLER_CREATE;

@Slf4j
@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;
    private final GroupInviteService groupInviteService;

    @PostMapping
    public ResponseEntity<Long> createGroup(@RequestBody CreateGroupRequestDto request) {
        log.info(TENANT_CONTROLLER_CREATE + ": " + request.getDisplayName());
        Long groupId = groupService.createGroup(request);
        return ResponseEntity.ok(groupId);
    }

    @PostMapping("/join")
    public ResponseEntity<Long> joinGroup(@RequestBody JoinGroupRequestDto request) {
        return ResponseEntity.ok(groupService.joinGroup(request));
    }

    @PatchMapping("/members/{memberId}/approve")
    public ResponseEntity<Void> approveMember(@PathVariable Long memberId) {
        groupService.approveMember(memberId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{groupId}")
    public ResponseEntity<GroupResponseDto> getGroupDetails(@PathVariable Long groupId) {
        return ResponseEntity.ok(groupService.getGroupDetails(groupId));
    }

    @GetMapping("/{groupId}/join-requests")
    public ResponseEntity<java.util.List<GroupJoinRequestDto>> getPendingJoinRequests(@PathVariable Long groupId) {
        return ResponseEntity.ok(groupService.getPendingMembers(groupId));
    }

    @GetMapping("/{groupId}/members")
    public ResponseEntity<java.util.List<GroupMemberSimpleDto>> getMembers(@PathVariable Long groupId) {
        return ResponseEntity.ok(groupService.getApprovedMembers(groupId));
    }

    @PatchMapping("/{groupId}/view-preference")
    public ResponseEntity<Void> updateViewPreference(@PathVariable Long groupId,
                                                     @RequestBody UpdateViewPreferenceRequestDto request) {
        Long userId = AuthUtil.getCurrentUserId();
        groupService.updateViewPreference(userId, groupId, request);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{groupId}")
    public ResponseEntity<GroupResponseDto> updateGroup(@PathVariable Long groupId,
                                                        @RequestBody UpdateGroupRequestDto request) {
        return ResponseEntity.ok(groupService.updateGroup(groupId, request));
    }

    @DeleteMapping("/{groupId}")
    public ResponseEntity<Void> deleteGroup(@PathVariable Long groupId) {
        groupService.deleteGroup(groupId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{groupId}/members/{userId}")
    public ResponseEntity<Void> removeMember(@PathVariable Long groupId, @PathVariable Long userId) {
        groupService.removeMember(groupId, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{groupId}/invites")
    public ResponseEntity<Void> sendInvite(@PathVariable Long groupId, @RequestBody CreateGroupInviteRequestDto request) {
        groupInviteService.sendInvite(groupId, request);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{groupId}/pin")
    public ResponseEntity<Void> togglePin(@PathVariable Long groupId) {
        groupService.togglePinGroup(groupId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{groupId}/mark-seen")
    public ResponseEntity<Void> markSeen(@PathVariable Long groupId) {
        groupService.markGroupSeen(groupId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/activity-status")
    public ResponseEntity<java.util.Map<Long, Boolean>> getActivityStatus() {
        return ResponseEntity.ok(groupService.getActivityStatus());
    }
}

