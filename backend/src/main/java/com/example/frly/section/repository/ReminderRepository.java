package com.example.frly.section.repository;

import com.example.frly.common.enums.RecordStatus;
import com.example.frly.section.model.Reminder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface ReminderRepository extends JpaRepository<Reminder, Long> {
    List<Reminder> findBySectionIdAndStatusNotOrderByTriggerTimeAsc(Long sectionId, RecordStatus status);

    List<Reminder> findByIsSentFalseAndNotifyTrueAndStatusAndTriggerTimeLessThanEqual(RecordStatus status, LocalDateTime triggerTime);

    List<Reminder> findBySectionIdAndStatusNot(Long sectionId, RecordStatus status);
}
