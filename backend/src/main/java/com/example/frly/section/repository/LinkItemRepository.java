package com.example.frly.section.repository;

import com.example.frly.common.enums.RecordStatus;
import com.example.frly.section.model.LinkItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LinkItemRepository extends JpaRepository<LinkItem, Long> {

    List<LinkItem> findBySectionIdAndStatusNotOrderByPositionAsc(Long sectionId, RecordStatus status);

    List<LinkItem> findBySectionIdAndStatusNot(Long sectionId, RecordStatus status);
}
