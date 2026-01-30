package com.example.frly.section.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Data
public class PaymentExpenseDto {
    private Long id;
    private Long sectionId;
    private Long paidByUserId;
    private String paidByFirstName;
    private String paidByLastName;
    private String description;
    private BigDecimal totalAmount;
    private String currency;
    private OffsetDateTime expenseDate;
    private List<PaymentShareDto> shares;
}
