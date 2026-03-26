package com.example.frly.notification;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SectionNotificationPreferenceRepository extends JpaRepository<SectionNotificationPreference, Long> {
    
    Optional<SectionNotificationPreference> findByGroupMemberIdAndSectionType(Long groupMemberId, String sectionType);
    
    List<SectionNotificationPreference> findByGroupMemberId(Long groupMemberId);
    
    @Query("SELECT snp FROM SectionNotificationPreference snp WHERE snp.groupMember.user.id = :userId AND snp.groupMember.group.id = :groupId")
    List<SectionNotificationPreference> findByUserIdAndGroupId(@Param("userId") Long userId, @Param("groupId") Long groupId);
    
    @Query("SELECT snp FROM SectionNotificationPreference snp WHERE snp.groupMember.user.id = :userId AND snp.groupMember.group.id = :groupId AND snp.sectionType = :sectionType")
    Optional<SectionNotificationPreference> findByUserIdAndGroupIdAndSectionType(
        @Param("userId") Long userId, 
        @Param("groupId") Long groupId, 
        @Param("sectionType") String sectionType
    );
}
