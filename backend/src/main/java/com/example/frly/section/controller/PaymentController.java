package com.example.frly.section.controller;

import com.example.frly.section.dto.CreatePaymentExpenseRequestDto;
import com.example.frly.section.dto.PaymentBalanceDto;
import com.example.frly.section.dto.PaymentExpenseDto;
import com.example.frly.section.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups/sections")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/{sectionId}/payments/expenses")
    public ResponseEntity<Long> addExpense(@PathVariable Long sectionId,
                                           @RequestBody CreatePaymentExpenseRequestDto request) {
        Long id = paymentService.addExpense(sectionId, request);
        return ResponseEntity.ok(id);
    }

    @GetMapping("/{sectionId}/payments/expenses")
    public ResponseEntity<List<PaymentExpenseDto>> getExpenses(@PathVariable Long sectionId) {
        return ResponseEntity.ok(paymentService.getExpenses(sectionId));
    }

    @PutMapping("/{sectionId}/payments/expenses/{expenseId}")
    public ResponseEntity<Void> updateExpense(@PathVariable Long sectionId,
                                              @PathVariable Long expenseId,
                                              @RequestBody CreatePaymentExpenseRequestDto request) {
        paymentService.updateExpense(sectionId, expenseId, request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{sectionId}/payments/expenses/{expenseId}")
    public ResponseEntity<Void> deleteExpense(@PathVariable Long sectionId,
                                              @PathVariable Long expenseId) {
        paymentService.deleteExpense(sectionId, expenseId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{sectionId}/payments/balances")
    public ResponseEntity<List<PaymentBalanceDto>> getBalances(@PathVariable Long sectionId) {
        return ResponseEntity.ok(paymentService.getBalances(sectionId));
    }
}
