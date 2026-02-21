package com.example.frly.section.repository;

import com.example.frly.section.model.Reminder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface ReminderRepository extends JpaRepository<Reminder, Long> {
    List<Reminder> findBySectionIdOrderByTriggerTimeAsc(Long sectionId);

    List<Reminder> findByIsSentFalseAndNotifyTrueAndTriggerTimeLessThanEqual(LocalDateTime triggerTime);
}
