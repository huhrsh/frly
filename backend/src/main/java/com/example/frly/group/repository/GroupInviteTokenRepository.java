package com.example.frly.group.repository;

import com.example.frly.group.enums.GroupInviteStatus;
import com.example.frly.group.model.GroupInviteToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface GroupInviteTokenRepository extends JpaRepository<GroupInviteToken, Long> {

    Optional<GroupInviteToken> findFirstByTokenHashAndStatusAndExpiresAtAfter(String tokenHash, GroupInviteStatus status, Instant now);

    List<GroupInviteToken> findByUserIdAndStatusAndExpiresAtAfterOrderByCreatedAtDesc(Long userId, GroupInviteStatus status, Instant now);

    List<GroupInviteToken> findByGroupIdAndUserIdAndStatus(Long groupId, Long userId, GroupInviteStatus status);

    /**
     * Fetches only the latest (most recent) pending invite per group for a given user.
     * Uses DISTINCT ON to get one row per group_id, ordered by created_at DESC within each group.
     * Eagerly fetches Group to prevent N+1 queries.
     */
    @Query(value = """
        SELECT git
        FROM GroupInviteToken git
        JOIN FETCH git.group g
        WHERE git.id IN (
            SELECT MAX(git2.id)
            FROM GroupInviteToken git2
            WHERE git2.user.id = :userId
              AND git2.status = :status
              AND git2.expiresAt > :now
            GROUP BY git2.group.id
        )
        ORDER BY git.createdAt DESC
        """)
    List<GroupInviteToken> findLatestPendingInvitesPerGroup(@Param("userId") Long userId,
                                                              @Param("status") GroupInviteStatus status,
                                                              @Param("now") Instant now);
}
