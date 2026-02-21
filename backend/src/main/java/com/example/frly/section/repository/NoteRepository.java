package com.example.frly.section.repository;

import com.example.frly.section.model.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface NoteRepository extends JpaRepository<Note, Long> {
    Optional<Note> findBySectionId(Long sectionId);
}
