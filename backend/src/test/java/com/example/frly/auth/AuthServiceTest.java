package com.example.frly.auth;

import com.example.frly.auth.dto.AuthResponseDto;
import com.example.frly.auth.dto.LoginRequestDto;
import com.example.frly.email.EmailService;
import com.example.frly.user.User;
import com.example.frly.user.UserMapper;
import com.example.frly.user.UserRepository;
import com.example.frly.user.dto.UserDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private BCryptPasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;
    @Mock private EmailService emailService;
    @Mock private UserMapper userMapper;
    @Mock private PasswordResetTokenRepository passwordResetTokenRepository;

    @InjectMocks
    private AuthService authService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "frontendBaseUrl", "http://localhost:3000/");
    }

    // ─── login ────────────────────────────────────────────────────────────────

    @Test
    void login_withValidCredentials_returnsTokenWithUser() {
        User user = buildUser(1L, "john@example.com", "hashed");
        AuthResponseDto tokenResponse = new AuthResponseDto("jwt-token", 9_999_999L);
        UserDto userDto = new UserDto();

        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "hashed")).thenReturn(true);
        when(jwtService.generateToken(1L, "john@example.com")).thenReturn(tokenResponse);
        when(userMapper.toUserDto(user)).thenReturn(userDto);

        AuthResponseDto result = authService.login(new LoginRequestDto("john@example.com", "password123"));

        assertNotNull(result);
        assertEquals("jwt-token", result.getAccessToken());
        assertSame(userDto, result.getUserDto());
    }

    @Test
    void login_withUnknownEmail_throwsRuntimeException() {
        when(userRepository.findByEmail("nobody@example.com")).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
            () -> authService.login(new LoginRequestDto("nobody@example.com", "pass")));
        assertEquals("Invalid credentials", ex.getMessage());
    }

    @Test
    void login_withWrongPassword_throwsRuntimeException() {
        User user = buildUser(1L, "john@example.com", "hashed");
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

        RuntimeException ex = assertThrows(RuntimeException.class,
            () -> authService.login(new LoginRequestDto("john@example.com", "wrong")));
        assertEquals("Invalid credentials", ex.getMessage());
    }

    // ─── resetPassword ────────────────────────────────────────────────────────

    @Test
    void resetPassword_withTooShortPassword_throwsRuntimeException() {
        RuntimeException ex = assertThrows(RuntimeException.class,
            () -> authService.resetPassword("some-token", "short"));
        assertTrue(ex.getMessage().contains("8 characters"));
    }

    @Test
    void resetPassword_withNullPassword_throwsRuntimeException() {
        assertThrows(RuntimeException.class,
            () -> authService.resetPassword("some-token", null));
    }

    @Test
    void resetPassword_withInvalidOrExpiredToken_throwsRuntimeException() {
        when(passwordResetTokenRepository
                .findFirstByTokenHashAndUsedAtIsNullAndExpiresAtAfter(any(), any()))
            .thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
            () -> authService.resetPassword("bad-token", "validpassword123"));
        assertTrue(ex.getMessage().contains("Invalid or expired token"));
    }

    @Test
    void resetPassword_withValidToken_updatesPasswordAndInvalidatesToken() {
        User user = buildUser(1L, "john@example.com", "old-hash");
        PasswordResetToken token = new PasswordResetToken();
        token.setUser(user);

        when(passwordResetTokenRepository
                .findFirstByTokenHashAndUsedAtIsNullAndExpiresAtAfter(any(), any()))
            .thenReturn(Optional.of(token));
        when(passwordEncoder.encode("newpassword123")).thenReturn("new-hash");

        authService.resetPassword("valid-raw-token", "newpassword123");

        assertEquals("new-hash", user.getEncryptedPassword());
        assertNotNull(token.getUsedAt());
        verify(userRepository).save(user);
        verify(passwordResetTokenRepository).save(token);
    }

    // ─── sendPasswordResetEmail ───────────────────────────────────────────────

    @Test
    void sendPasswordResetEmail_withUnknownEmail_doesNothing() {
        when(userRepository.findByEmail("nobody@example.com")).thenReturn(Optional.empty());

        assertDoesNotThrow(() -> authService.sendPasswordResetEmail("nobody@example.com"));
        verifyNoInteractions(passwordResetTokenRepository, emailService);
    }

    @Test
    void sendPasswordResetEmail_withExistingUser_sendsEmail() {
        User user = buildUser(1L, "john@example.com", "hashed");
        user.setFirstName("John");

        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(user));
        when(passwordResetTokenRepository.findByUserIdAndUsedAtIsNull(1L))
            .thenReturn(Collections.emptyList());
        when(emailService.loadTemplate("email/password-reset.html"))
            .thenReturn("Hi {{FIRST_NAME}} click {{RESET_LINK}}");

        authService.sendPasswordResetEmail("john@example.com");

        verify(passwordResetTokenRepository).save(any(PasswordResetToken.class));
        verify(emailService).sendHtml(eq("john@example.com"), anyString(), anyString());
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private User buildUser(Long id, String email, String encryptedPassword) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        user.setFirstName("John");
        user.setLastName("Doe");
        user.setEncryptedPassword(encryptedPassword);
        return user;
    }
}
