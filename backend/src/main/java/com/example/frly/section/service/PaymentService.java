package com.example.frly.section.service;

import com.example.frly.auth.AuthUtil;
import com.example.frly.common.exception.BadRequestException;
import com.example.frly.group.GroupContext;
import com.example.frly.group.service.GroupService;
import com.example.frly.section.dto.CreatePaymentExpenseRequestDto;
import com.example.frly.section.dto.PaymentBalanceDto;
import com.example.frly.section.dto.PaymentExpenseDto;
import com.example.frly.section.dto.PaymentShareDto;
import com.example.frly.section.model.PaymentExpense;
import com.example.frly.section.model.PaymentShare;
import com.example.frly.section.model.Section;
import com.example.frly.section.model.SectionType;
import com.example.frly.section.repository.PaymentExpenseRepository;
import com.example.frly.section.repository.PaymentShareRepository;
import com.example.frly.section.repository.SectionRepository;
import com.example.frly.user.User;
import com.example.frly.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final GroupService groupService;
    private final SectionRepository sectionRepository;
    private final UserRepository userRepository;
    private final PaymentExpenseRepository paymentExpenseRepository;
    private final PaymentShareRepository paymentShareRepository;

    @Transactional
    public Long addExpense(Long sectionId, CreatePaymentExpenseRequestDto request) {
        groupService.validateGroupAccess(AuthUtil.getCurrentUserId(), GroupContext.getGroupId());

        Section section = sectionRepository.getReferenceById(sectionId);
        if (section.getType() != SectionType.PAYMENT) {
            throw new BadRequestException("Cannot add payment expense to non-PAYMENT section");
        }

        if (request.getTotalAmount() == null || request.getTotalAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("totalAmount must be positive");
        }
        if (request.getPaidByUserId() == null) {
            throw new BadRequestException("paidByUserId is required");
        }
        if (request.getShares() == null || request.getShares().isEmpty()) {
            throw new BadRequestException("At least one share is required");
        }

        // Validate that sum of all shares equals totalAmount
        java.math.BigDecimal sharesTotal = request.getShares().stream()
                .map(CreatePaymentExpenseRequestDto.ShareInput::getShareAmount)
                .filter(java.util.Objects::nonNull)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

        if (sharesTotal.compareTo(request.getTotalAmount()) != 0) {
            throw new BadRequestException("Sum of shares must equal total amount");
        }

        User payer = userRepository.getReferenceById(request.getPaidByUserId());

        PaymentExpense expense = new PaymentExpense();
        expense.setSection(section);
        expense.setPaidBy(payer);
        expense.setDescription(request.getDescription());
        expense.setTotalAmount(request.getTotalAmount());
        // For now we only support INR; ignore any other currency in the request
        expense.setCurrency("INR");
        expense.setExpenseDate(request.getExpenseDate());

        expense = paymentExpenseRepository.save(expense);

        for (CreatePaymentExpenseRequestDto.ShareInput shareInput : request.getShares()) {
            User user = userRepository.getReferenceById(shareInput.getUserId());
            PaymentShare share = new PaymentShare();
            share.setExpense(expense);
            share.setUser(user);
            share.setShareAmount(shareInput.getShareAmount());
            paymentShareRepository.save(share);
        }

        return expense.getId();
    }

    @Transactional
    public void updateExpense(Long sectionId, Long expenseId, CreatePaymentExpenseRequestDto request) {
        groupService.validateGroupAccess(AuthUtil.getCurrentUserId(), GroupContext.getGroupId());

        PaymentExpense expense = paymentExpenseRepository.findById(expenseId)
                .orElseThrow(() -> new BadRequestException("Expense not found"));

        if (!expense.getSection().getId().equals(sectionId)) {
            throw new BadRequestException("Expense does not belong to this section");
        }

        if (request.getTotalAmount() == null || request.getTotalAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("totalAmount must be positive");
        }
        if (request.getPaidByUserId() == null) {
            throw new BadRequestException("paidByUserId is required");
        }
        if (request.getShares() == null || request.getShares().isEmpty()) {
            throw new BadRequestException("At least one share is required");
        }

        BigDecimal sharesTotal = request.getShares().stream()
                .map(CreatePaymentExpenseRequestDto.ShareInput::getShareAmount)
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (sharesTotal.compareTo(request.getTotalAmount()) != 0) {
            throw new BadRequestException("Sum of shares must equal total amount");
        }

        User payer = userRepository.getReferenceById(request.getPaidByUserId());

        expense.setPaidBy(payer);
        expense.setDescription(request.getDescription());
        expense.setTotalAmount(request.getTotalAmount());
        expense.setCurrency("INR");
        expense.setExpenseDate(request.getExpenseDate());

        // Replace all existing shares for this expense
        java.util.List<PaymentShare> existing = paymentShareRepository.findByExpenseId(expenseId);
        paymentShareRepository.deleteAll(existing);

        for (CreatePaymentExpenseRequestDto.ShareInput shareInput : request.getShares()) {
            User user = userRepository.getReferenceById(shareInput.getUserId());
            PaymentShare share = new PaymentShare();
            share.setExpense(expense);
            share.setUser(user);
            share.setShareAmount(shareInput.getShareAmount());
            paymentShareRepository.save(share);
        }
    }

    @Transactional
    public void deleteExpense(Long sectionId, Long expenseId) {
        groupService.validateGroupAccess(AuthUtil.getCurrentUserId(), GroupContext.getGroupId());

        PaymentExpense expense = paymentExpenseRepository.findById(expenseId)
                .orElseThrow(() -> new BadRequestException("Expense not found"));

        if (!expense.getSection().getId().equals(sectionId)) {
            throw new BadRequestException("Expense does not belong to this section");
        }

        paymentExpenseRepository.delete(expense);
    }

    @Transactional(readOnly = true)
    public List<PaymentExpenseDto> getExpenses(Long sectionId) {
        groupService.validateGroupAccess(AuthUtil.getCurrentUserId(), GroupContext.getGroupId());

        List<PaymentExpense> expenses = paymentExpenseRepository.findBySectionIdOrderByExpenseDateDesc(sectionId);
        List<PaymentShare> allShares = paymentShareRepository.findByExpenseSectionId(sectionId);

        Map<Long, List<PaymentShare>> sharesByExpense = allShares.stream()
            .collect(Collectors.groupingBy(share -> share.getExpense().getId()));

        List<PaymentExpenseDto> result = new ArrayList<>();
        for (PaymentExpense expense : expenses) {
            PaymentExpenseDto dto = new PaymentExpenseDto();
            dto.setId(expense.getId());
            dto.setSectionId(expense.getSection().getId());
            dto.setPaidByUserId(expense.getPaidBy().getId());
            dto.setPaidByFirstName(expense.getPaidBy().getFirstName());
            dto.setPaidByLastName(expense.getPaidBy().getLastName());
            dto.setDescription(expense.getDescription());
            dto.setTotalAmount(expense.getTotalAmount());
            dto.setCurrency(expense.getCurrency());
            dto.setExpenseDate(expense.getExpenseDate());

            List<PaymentShare> shares = sharesByExpense.getOrDefault(expense.getId(), List.of());
            List<PaymentShareDto> shareDtos = new ArrayList<>();
            for (PaymentShare share : shares) {
                PaymentShareDto sDto = new PaymentShareDto();
                sDto.setUserId(share.getUser().getId());
                sDto.setFirstName(share.getUser().getFirstName());
                sDto.setLastName(share.getUser().getLastName());
                sDto.setShareAmount(share.getShareAmount());
                shareDtos.add(sDto);
            }
            dto.setShares(shareDtos);
            result.add(dto);
        }

        return result;
    }

    @Transactional(readOnly = true)
    public List<PaymentBalanceDto> getBalances(Long sectionId) {
        groupService.validateGroupAccess(AuthUtil.getCurrentUserId(), GroupContext.getGroupId());

        List<PaymentExpense> expenses = paymentExpenseRepository.findBySectionIdOrderByExpenseDateDesc(sectionId);
        List<PaymentShare> allShares = paymentShareRepository.findByExpenseSectionId(sectionId);

        Map<Long, List<PaymentShare>> sharesByExpense = allShares.stream()
            .collect(Collectors.groupingBy(share -> share.getExpense().getId()));

        Map<Long, PaymentBalanceDto> balances = new HashMap<>();

        for (PaymentExpense expense : expenses) {
            Long payerId = expense.getPaidBy().getId();
            balances.computeIfAbsent(payerId, id -> {
                PaymentBalanceDto dto = new PaymentBalanceDto();
                dto.setUserId(id);
                dto.setFirstName(expense.getPaidBy().getFirstName());
                dto.setLastName(expense.getPaidBy().getLastName());
                dto.setBalance(BigDecimal.ZERO);
                return dto;
            });

            PaymentBalanceDto payerBalance = balances.get(payerId);
            payerBalance.setBalance(payerBalance.getBalance().add(expense.getTotalAmount()));

            List<PaymentShare> shares = sharesByExpense.getOrDefault(expense.getId(), List.of());
            for (PaymentShare share : shares) {
                Long userId = share.getUser().getId();
                balances.computeIfAbsent(userId, id -> {
                    PaymentBalanceDto dto = new PaymentBalanceDto();
                    dto.setUserId(id);
                    dto.setFirstName(share.getUser().getFirstName());
                    dto.setLastName(share.getUser().getLastName());
                    dto.setBalance(BigDecimal.ZERO);
                    return dto;
                });
                PaymentBalanceDto b = balances.get(userId);
                b.setBalance(b.getBalance().subtract(share.getShareAmount()));
            }
        }

        return new ArrayList<>(balances.values());
    }
}
