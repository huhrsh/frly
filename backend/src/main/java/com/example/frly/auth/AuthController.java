package com.example.frly.auth;

import com.example.frly.auth.dto.AuthResponseDto;
import com.example.frly.auth.dto.LoginRequestDto;
import com.example.frly.auth.dto.ForgotPasswordRequestDto;
import com.example.frly.auth.dto.ResetPasswordRequestDto;
import com.example.frly.group.GroupContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import static com.example.frly.constants.LogConstants.AUTH_LOGIN_ATTEMPT;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> login(@RequestBody LoginRequestDto request) {
        log.info(AUTH_LOGIN_ATTEMPT + ": " + request.getEmail());
        GroupContext.clear();
        AuthResponseDto response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@RequestBody ForgotPasswordRequestDto request) {
        authService.sendPasswordResetEmail(request.getEmail());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@RequestBody ResetPasswordRequestDto request) {
        authService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok().build();
    }
}

