package com.example.frly.group.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.frly.group.model.Group;

import java.util.Optional;

public interface GroupRepository extends JpaRepository<Group, Long> {
    Optional<Group> findByInviteCode(String inviteCode);
    boolean existsByInviteCode(String inviteCode);
}
