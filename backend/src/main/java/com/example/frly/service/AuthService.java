package com.example.frly.service;

import com.example.frly.dto.AuthResponseDto;
import com.example.frly.dto.LoginRequestDto;
import com.example.frly.entity.User;
import com.example.frly.repository.UserRepository;
import com.example.frly.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

    public AuthResponseDto login(LoginRequestDto request) {
        log.info(AUTH_LOGIN_ATTEMPT + ": " + request.getEmail());
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getEncryptedPassword())) {
            log.warn(AUTH_LOGIN_FAILED + ": " + request.getEmail());
            throw new RuntimeException("Invalid credentials");
        }

        String token = jwtService.generateToken(user.getId(), user.getEmail());
        log.info(AUTH_LOGIN_SUCCESS + ": " + request.getEmail());
        return new AuthResponseDto(token, 0L);
    }
}

