package com.example.frly.section.repository;

import com.example.frly.common.enums.RecordStatus;
import com.example.frly.section.model.Reminder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ReminderRepository extends JpaRepository<Reminder, Long> {
    List<Reminder> findBySectionIdAndStatusNotOrderByTriggerTimeAsc(Long sectionId, RecordStatus status);

    List<Reminder> findByIsSentFalseAndNotifyTrueAndStatusAndTriggerTimeLessThanEqual(RecordStatus status, LocalDateTime triggerTime);
    
    @Query("SELECT r FROM Reminder r JOIN FETCH r.section WHERE r.isSent = false AND r.status = :status AND r.triggerTime <= :triggerTime")
    List<Reminder> findDueRemindersWithSection(@Param("status") RecordStatus status, @Param("triggerTime") LocalDateTime triggerTime);

    List<Reminder> findBySectionIdAndStatusNot(Long sectionId, RecordStatus status);
}
