package com.example.frly.section.repository;

import com.example.frly.common.enums.RecordStatus;
import com.example.frly.section.model.PaymentExpense;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface PaymentExpenseRepository extends JpaRepository<PaymentExpense, Long> {
    List<PaymentExpense> findBySectionIdAndStatusNotOrderByExpenseDateDesc(Long sectionId, RecordStatus status);

    Page<PaymentExpense> findBySectionIdAndStatusNot(Long sectionId, RecordStatus status, Pageable pageable);

    @Query("select coalesce(sum(e.totalAmount), 0) from PaymentExpense e where e.section.id = :sectionId and e.status <> :status and e.expenseType <> :settlementType")
    BigDecimal sumBySectionIdAndStatusNotAndExpenseTypeNot(@Param("sectionId") Long sectionId,
                                                          @Param("status") RecordStatus status,
                                                          @Param("settlementType") String settlementType);
}