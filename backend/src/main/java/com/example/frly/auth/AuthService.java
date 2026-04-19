package com.example.frly.auth;

import com.example.frly.auth.dto.AuthResponseDto;
import com.example.frly.auth.dto.LoginRequestDto;
import com.example.frly.common.exception.BadRequestException;
import com.example.frly.email.EmailService;
import com.example.frly.user.User;
import com.example.frly.user.UserMapper;
import com.example.frly.user.UserRepository;
import com.example.frly.user.UserService;
import com.example.frly.user.dto.UserDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;

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
    private final UserService userService;
    private final SecureRandom random = new SecureRandom();


    @Value("${app.frontend.base-url}")
    private String frontendBaseUrl;

    @Value("${google.client-id}")
    private String googleClientId;

    private final RestTemplate restTemplate = new RestTemplate();

    public AuthResponseDto login(LoginRequestDto request) {
        log.info(AUTH_LOGIN_ATTEMPT + ": " + request.getEmail());
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if ("GOOGLE".equals(user.getAuthProvider())) {
            throw new BadRequestException("This account uses Google Sign In. Please sign in with Google.");
        }

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

    @SuppressWarnings("unchecked")
    public AuthResponseDto googleSignIn(String idToken) {
        // Verify token with Google tokeninfo endpoint
        String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken;
        Map<String, Object> tokenInfo;
        try {
            tokenInfo = restTemplate.getForObject(url, Map.class);
        } catch (Exception e) {
            log.warn("Google token verification failed", e);
            throw new BadRequestException("Invalid Google token");
        }

        if (tokenInfo == null) {
            throw new BadRequestException("Invalid Google token");
        }

        // Validate audience matches our client ID
        String aud = (String) tokenInfo.get("aud");
        if (!googleClientId.equals(aud)) {
            throw new BadRequestException("Google token audience mismatch");
        }

        String email = (String) tokenInfo.get("email");
        String givenName = (String) tokenInfo.getOrDefault("given_name", "");
        String familyName = (String) tokenInfo.getOrDefault("family_name", "");
        String picture = (String) tokenInfo.get("picture");

        if (email == null || email.isBlank()) {
            throw new BadRequestException("Google account has no email");
        }

        Optional<User> existing = userRepository.findByEmail(email);

        User user;
        if (existing.isPresent()) {
            user = existing.get();
            // If the account was created with email/password, reject Google sign-in
            if ("LOCAL".equals(user.getAuthProvider())) {
                throw new BadRequestException("This email is already registered with a password. Please sign in with your password.");
            }
            // Existing Google user — just log in
        } else {
            // Create new Google user
            user = new User();
            user.setEmail(email);
            user.setFirstName(givenName.isBlank() ? email.split("@")[0] : givenName);
            user.setLastName(familyName.isBlank() ? "" : familyName);
            user.setAuthProvider("GOOGLE");
            if (picture != null) {
                user.setPfpUrl(picture);
            }
            user = userRepository.save(user);
            userService.addToDemoGroup(user);
            log.info("Created new Google user: {}", email);
        }

        AuthResponseDto responseDto = jwtService.generateToken(user.getId(), user.getEmail());
        responseDto.setUserDto(userMapper.toUserDto(user));
        log.info("Google sign-in success: {}", email);
        return responseDto;
    }

    public void sendPasswordResetEmail(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            // Invalidate previous tokens for this user by marking them used
            passwordResetTokenRepository.findByUserIdAndUsedAtIsNull(user.getId())
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

            String subject = "Reset your fryly password";
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
                .findFirstByTokenHashAndUsedAtIsNullAndExpiresAtAfter(tokenHash, Instant.now())
                .orElseThrow(() -> new RuntimeException("Invalid or expired token"));

        User user = resetToken.getUser();
        user.setEncryptedPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        resetToken.setUsedAt(Instant.now());
        passwordResetTokenRepository.save(resetToken);
    }

    private String generateRandomToken() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
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

