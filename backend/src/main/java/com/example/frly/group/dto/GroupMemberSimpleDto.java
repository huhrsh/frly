package com.example.frly.group.dto;

import lombok.Data;

@Data
public class GroupMemberSimpleDto {
    private Long userId;
    private String firstName;
    private String lastName;
    private String email;
    private String role;
}
