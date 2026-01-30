package com.example.frly.section.model;

import com.example.frly.common.GroupAwareEntity;
import com.example.frly.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "payment_expenses", schema = "config")
@Getter
@Setter
public class PaymentExpense extends GroupAwareEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id", nullable = false)
    private Section section;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paid_by_user_id", nullable = false)
    private User paidBy;

    @Column(length = 255)
    private String description;

    @Column(name = "total_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal totalAmount;

    @Column(length = 16)
    private String currency;

    @Column(name = "expense_date")
    private OffsetDateTime expenseDate;
}
