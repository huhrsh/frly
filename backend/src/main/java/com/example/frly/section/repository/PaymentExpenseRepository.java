package com.example.frly.section.repository;

import com.example.frly.common.enums.RecordStatus;
import com.example.frly.section.model.PaymentExpense;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentExpenseRepository extends JpaRepository<PaymentExpense, Long> {
    List<PaymentExpense> findBySectionIdAndStatusNotOrderByExpenseDateDesc(Long sectionId, RecordStatus status);

    Page<PaymentExpense> findBySectionIdAndStatusNot(Long sectionId, RecordStatus status, Pageable pageable);
}