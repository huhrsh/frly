package com.example.frly.auth;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findFirstByTokenHashAndUsedAtIsNullAndExpiresAtAfter(String tokenHash, Instant now);
}
