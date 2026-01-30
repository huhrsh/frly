package com.example.frly.auth;

import com.example.frly.auth.dto.AuthResponseDto;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

import static com.example.frly.constants.LogConstants.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtService {

    @Value("${frly.security.jwt.secret}")
    private String secret;

    @Value("${frly.security.jwt.expiration-ms}")
    private long expirationMs;

    private SecretKey key;

    @PostConstruct
    public void init() {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public AuthResponseDto generateToken(Long userId, String email) {
        long now = System.currentTimeMillis();
        Date issuedAt = new Date(now);
        Date expiry = new Date(now + expirationMs);
        log.info(JWT_GENERATE + ": " + email);
        String jwt = Jwts.builder()
                .setSubject(String.valueOf(userId))
                .setIssuedAt(issuedAt)
                .setExpiration(expiry)
                .claim("email", email)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
        return new AuthResponseDto(jwt, expiry.getTime());
    }

    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (Exception ex) {
            log.warn(JWT_INVALID + ": " + ex.getMessage());
            return false;
        }
    }

    public Long getUserId(String token) {
        Claims claims = parseClaims(token);
        return Long.parseLong(claims.getSubject());
    }

    public String getEmail(String token) {
        Claims claims = parseClaims(token);
        return claims.get("email", String.class);
    }

    private Claims parseClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
