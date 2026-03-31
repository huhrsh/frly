package com.example.frly.auth;

import com.example.frly.auth.dto.AuthResponseDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    // Minimum 32-char secret required for HMAC-SHA256
    private static final String TEST_SECRET =
        "test-secret-key-that-is-at-least-32-chars-long-for-hmac256-ok";

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secret", TEST_SECRET);
        ReflectionTestUtils.setField(jwtService, "expirationMs", 3_600_000L); // 1 hour
        jwtService.init(); // replaces @PostConstruct
    }

    @Test
    void generateToken_returnsNonNullToken() {
        AuthResponseDto response = jwtService.generateToken(1L, "user@example.com");
        assertNotNull(response.getAccessToken());
        assertFalse(response.getAccessToken().isBlank());
    }

    @Test
    void generateToken_producesValidToken() {
        AuthResponseDto response = jwtService.generateToken(1L, "user@example.com");
        assertTrue(jwtService.validateToken(response.getAccessToken()));
    }

    @Test
    void generateToken_getUserId_returnsCorrectId() {
        AuthResponseDto response = jwtService.generateToken(42L, "user@example.com");
        assertEquals(42L, jwtService.getUserId(response.getAccessToken()));
    }

    @Test
    void generateToken_getEmail_returnsCorrectEmail() {
        AuthResponseDto response = jwtService.generateToken(1L, "precise@example.com");
        assertEquals("precise@example.com", jwtService.getEmail(response.getAccessToken()));
    }

    @Test
    void generateToken_expiresInIsInTheFuture() {
        AuthResponseDto response = jwtService.generateToken(1L, "user@example.com");
        assertTrue(response.getExpiresIn() > System.currentTimeMillis());
    }

    @Test
    void validateToken_withGarbageString_returnsFalse() {
        assertFalse(jwtService.validateToken("not.a.valid.jwt.token"));
    }

    @Test
    void validateToken_withEmptyString_returnsFalse() {
        assertFalse(jwtService.validateToken(""));
    }

    @Test
    void validateToken_withTokenSignedByDifferentSecret_returnsFalse() {
        // Build a second JwtService with a different secret
        JwtService otherService = new JwtService();
        ReflectionTestUtils.setField(otherService, "secret",
            "different-secret-key-that-is-at-least-32-chars-long");
        ReflectionTestUtils.setField(otherService, "expirationMs", 3_600_000L);
        otherService.init();

        String foreignToken = otherService.generateToken(1L, "x@example.com").getAccessToken();
        assertFalse(jwtService.validateToken(foreignToken));
    }
}
