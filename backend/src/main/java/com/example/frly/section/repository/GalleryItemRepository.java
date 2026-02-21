package com.example.frly.section.repository;

import com.example.frly.section.model.GalleryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GalleryItemRepository extends JpaRepository<GalleryItem, Long> {
    List<GalleryItem> findBySectionIdOrderByCreatedAtDesc(Long sectionId);
}
