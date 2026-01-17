package com.example.frly.controller;

import com.example.frly.dto.AuthResponseDto;
import com.example.frly.dto.LoginRequestDto;
import com.example.frly.service.AuthService;
import com.example.frly.tenant.TenantContext;
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
        TenantContext.clear();
        AuthResponseDto response = authService.login(request);
        return ResponseEntity.ok(response);
    }
}

