package com.example.frly.group.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.example.frly.group.model.GroupMember;
import com.example.frly.group.enums.GroupMemberStatus;

import java.util.List;
import java.util.Optional;

public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {
    boolean existsByUserIdAndGroupId(Long userId, Long groupId);
    Optional<GroupMember> findByUserIdAndGroupId(Long userId, Long groupId);
    List<GroupMember> findByUserId(Long userId);

    List<GroupMember> findByUserIdAndStatusNot(Long userId, GroupMemberStatus status);

    List<GroupMember> findByGroupIdAndStatus(Long groupId, GroupMemberStatus status);
    
    @Query("SELECT gm FROM GroupMember gm JOIN FETCH gm.user WHERE gm.group.id = :groupId AND gm.status = :status")
    List<GroupMember> findByGroupIdAndStatusWithUser(@Param("groupId") Long groupId, @Param("status") GroupMemberStatus status);

    long countByGroupIdAndStatus(Long groupId, GroupMemberStatus status);

    List<GroupMember> findByGroupIdAndRole_Name(Long groupId, String roleName);
}
