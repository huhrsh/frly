package com.example.frly.group.controller;

import com.example.frly.group.dto.CreateGroupRequestDto;
import com.example.frly.group.dto.GroupResponseDto;
import com.example.frly.group.dto.GroupJoinRequestDto;
import com.example.frly.group.dto.JoinGroupRequestDto;
import com.example.frly.group.dto.UpdateViewPreferenceRequestDto;
import com.example.frly.group.dto.GroupMemberSimpleDto;
import com.example.frly.group.service.GroupService;
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
}

