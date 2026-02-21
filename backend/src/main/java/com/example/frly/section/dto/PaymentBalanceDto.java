package com.example.frly.section.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class PaymentBalanceDto {
    private Long userId;
    private String firstName;
    private String lastName;
    private BigDecimal balance; // positive = others owe them, negative = they owe
}
