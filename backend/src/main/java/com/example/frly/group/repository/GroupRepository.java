package com.example.frly.group.repository;

import com.example.frly.common.enums.RecordStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import com.example.frly.group.model.Group;

import java.util.List;
import java.util.Optional;

public interface GroupRepository extends JpaRepository<Group, Long> {
    Optional<Group> findByInviteCode(String inviteCode);
    boolean existsByInviteCode(String inviteCode);
    List<Group> findByStatus(RecordStatus recordStatus);
}
