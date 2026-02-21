package com.example.frly.auth;

import com.example.frly.auth.dto.AuthResponseDto;
import com.example.frly.auth.dto.LoginRequestDto;
import com.example.frly.email.EmailService;
import com.example.frly.user.User;
import com.example.frly.user.UserMapper;
import com.example.frly.user.UserRepository;
import com.example.frly.user.dto.UserDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import static com.example.frly.constants.LogConstants.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final UserMapper userMapper;
    private final PasswordResetTokenRepository passwordResetTokenRepository;

    @Value("${app.frontend.base-url}")
    private String frontendBaseUrl;

    public AuthResponseDto login(LoginRequestDto request) {
        log.info(AUTH_LOGIN_ATTEMPT + ": " + request.getEmail());
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getEncryptedPassword())) {
            log.warn(AUTH_LOGIN_FAILED + ": " + request.getEmail());
            throw new RuntimeException("Invalid credentials");
        }

        AuthResponseDto responseDto = jwtService.generateToken(user.getId(), user.getEmail());

        // Attach basic user info so frontend can display it in navbar
        responseDto.setUserDto(userMapper.toUserDto(user));

        log.info(AUTH_LOGIN_SUCCESS + ": " + request.getEmail());
        return responseDto;
    }

    public void sendPasswordResetEmail(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            // Invalidate previous tokens for this user by marking them used
            passwordResetTokenRepository.findAll().stream()
                    .filter(t -> t.getUser().getId().equals(user.getId()) && t.getUsedAt() == null)
                    .forEach(t -> {
                        t.setUsedAt(java.time.Instant.now());
                        passwordResetTokenRepository.save(t);
                    });

            String rawToken = generateRandomToken();
            String tokenHash = sha256(rawToken);

            PasswordResetToken token = new PasswordResetToken();
            token.setUser(user);
            token.setTokenHash(tokenHash);
            token.setExpiresAt(java.time.Instant.now().plusSeconds(30 * 60)); // 30 minutes
            passwordResetTokenRepository.save(token);

            String link = frontendBaseUrl.replaceAll("/$", "") + "/reset-password?token=" + rawToken;

            String subject = "Reset your FRYLY password";
            String template = emailService.loadTemplate("email/password-reset.html");
            String html = template
                    .replace("{{FIRST_NAME}}", user.getFirstName())
                    .replace("{{RESET_LINK}}", link);

            emailService.sendHtml(user.getEmail(), subject, html);
        });
    }

    public void resetPassword(String token, String newPassword) {
        if (newPassword == null || newPassword.length() < 8) {
            throw new RuntimeException("Password must be at least 8 characters long");
        }

        String tokenHash = sha256(token);
        PasswordResetToken resetToken = passwordResetTokenRepository
                .findFirstByTokenHashAndUsedAtIsNullAndExpiresAtAfter(tokenHash, java.time.Instant.now())
                .orElseThrow(() -> new RuntimeException("Invalid or expired token"));

        User user = resetToken.getUser();
        user.setEncryptedPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        resetToken.setUsedAt(java.time.Instant.now());
        passwordResetTokenRepository.save(resetToken);
    }

    private String generateRandomToken() {
        java.security.SecureRandom random = new java.security.SecureRandom();
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String sha256(String value) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                String h = Integer.toHexString(0xff & b);
                if (h.length() == 1) hex.append('0');
                hex.append(h);
            }
            return hex.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to hash token", e);
        }
    }
}

