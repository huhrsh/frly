package com.example.frly.activity;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {

    List<ActivityLog> findByGroupIdOrderByCreatedAtDesc(String groupId, Pageable pageable);

    List<ActivityLog> findByGroupIdInOrderByCreatedAtDesc(List<String> groupIds, Pageable pageable);
}
