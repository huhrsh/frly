package com.example.frly.group.dto;

import com.example.frly.group.enums.GroupViewPreference;
import lombok.Data;

@Data
public class UpdateViewPreferenceRequestDto {
    private GroupViewPreference viewPreference;
}
