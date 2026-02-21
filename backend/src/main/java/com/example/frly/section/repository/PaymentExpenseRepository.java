package com.example.frly.section.repository;

import com.example.frly.section.model.PaymentExpense;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentExpenseRepository extends JpaRepository<PaymentExpense, Long> {
    List<PaymentExpense> findBySectionIdOrderByExpenseDateDesc(Long sectionId);
}