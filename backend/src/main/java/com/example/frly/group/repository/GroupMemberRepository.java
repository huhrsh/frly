package com.example.frly.group.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.frly.group.model.GroupMember;

import java.util.Optional;

public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {
    boolean existsByUserIdAndGroupId(Long userId, Long groupId);
    Optional<GroupMember> findByUserIdAndGroupId(Long userId, Long groupId);
    java.util.List<GroupMember> findByUserId(Long userId);

    java.util.List<GroupMember> findByGroupIdAndStatus(Long groupId, com.example.frly.group.enums.GroupMemberStatus status);

    long countByGroupIdAndStatus(Long groupId, com.example.frly.group.enums.GroupMemberStatus status);

    java.util.List<GroupMember> findByGroupIdAndRole_Name(Long groupId, String roleName);
}
