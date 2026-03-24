package com.example.frly.section.repository;

import com.example.frly.common.enums.RecordStatus;
import com.example.frly.section.model.UserSectionOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface UserSectionOrderRepository extends JpaRepository<UserSectionOrder, Long> {

    List<UserSectionOrder> findByUserIdAndStatusNotOrderByPositionAsc(Long userId, RecordStatus status);

    List<UserSectionOrder> findByUserIdAndSectionIdInAndStatusNot(Long userId, Collection<Long> sectionIds, RecordStatus status);
}
