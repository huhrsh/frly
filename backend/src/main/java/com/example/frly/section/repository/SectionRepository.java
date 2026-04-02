package com.example.frly.section.repository;

import com.example.frly.common.enums.RecordStatus;
import com.example.frly.section.model.Section;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface SectionRepository extends JpaRepository<Section, Long> {
    List<Section> findByStatusNotOrderByPositionAsc(RecordStatus status);

    java.util.List<Section> findByParentSectionIdAndStatusNot(Long parentId, RecordStatus status);

    /**
     * Native query to check section existence for a group, bypassing Hibernate's @TenantId filter.
     * group_id is stored as a VARCHAR (the group's numeric ID as a string).
     */
    @Query(value = "SELECT EXISTS(SELECT 1 FROM config.sections WHERE group_id = :groupId)", nativeQuery = true)
    boolean existsByGroupId(@Param("groupId") String groupId);
}
