package com.example.frly.section.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class PaymentShareDto {
    private Long userId;
    private String firstName;
    private String lastName;
    private BigDecimal shareAmount;
}
