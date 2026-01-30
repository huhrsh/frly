package com.example.frly.section.repository;

import com.example.frly.section.model.PaymentShare;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentShareRepository extends JpaRepository<PaymentShare, Long> {
    List<PaymentShare> findByExpenseId(Long expenseId);

    // All shares for expenses within a given section
    List<PaymentShare> findByExpenseSectionId(Long sectionId);
}
