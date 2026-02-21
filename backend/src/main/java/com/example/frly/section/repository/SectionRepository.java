package com.example.frly.section.repository;

import com.example.frly.section.model.Section;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SectionRepository extends JpaRepository<Section, Long> {
    List<Section> findAllByOrderByPositionAsc();
}
