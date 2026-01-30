package com.example.frly.section.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Data
public class CreatePaymentExpenseRequestDto {
    private String description;
    private BigDecimal totalAmount;
    private String currency;
    private OffsetDateTime expenseDate;
    private Long paidByUserId;
    private List<ShareInput> shares;

    @Data
    public static class ShareInput {
        private Long userId;
        private BigDecimal shareAmount;
    }
}
