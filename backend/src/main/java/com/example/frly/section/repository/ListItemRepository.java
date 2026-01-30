package com.example.frly.section.repository;

import com.example.frly.section.model.ListItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ListItemRepository extends JpaRepository<ListItem, Long> {
    List<ListItem> findBySectionIdOrderByPositionAsc(Long sectionId);
}
