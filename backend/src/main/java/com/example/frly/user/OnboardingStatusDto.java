package com.example.frly.user;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class OnboardingStatusDto {
    private boolean hasGroup;
    private boolean hasSection;
    private boolean hasMember;
}
