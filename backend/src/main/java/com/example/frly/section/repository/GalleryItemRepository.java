package com.example.frly.section.repository;

import com.example.frly.common.enums.RecordStatus;
import com.example.frly.section.model.GalleryItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GalleryItemRepository extends JpaRepository<GalleryItem, Long> {
    List<GalleryItem> findBySectionIdAndStatusNotOrderByCreatedAtDesc(Long sectionId, RecordStatus status);

    long countBySectionIdAndStatusNot(Long sectionId, RecordStatus status);
}
