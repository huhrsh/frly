package com.example.frly.auth.dto;

import com.example.frly.user.dto.UserDto;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class AuthResponseDto {
    private String accessToken;
    private long expiresIn;
    private UserDto userDto;

    public AuthResponseDto(String accessToken, long expiresIn) {
        this.accessToken = accessToken;
        this.expiresIn = expiresIn;
    }
}

