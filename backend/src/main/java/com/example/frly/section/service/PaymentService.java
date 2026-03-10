package com.example.frly.section.service;

import com.example.frly.auth.AuthUtil;
import com.example.frly.common.enums.RecordStatus;
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
import com.example.frly.section.mapper.PaymentMapper;
import com.example.frly.user.User;
import com.example.frly.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final GroupService groupService;
    private final SectionRepository sectionRepository;
    private final UserRepository userRepository;
    private final PaymentExpenseRepository paymentExpenseRepository;
    private final PaymentShareRepository paymentShareRepository;
    private final PaymentMapper paymentMapper;

    @Transactional
    public Long addExpense(Long sectionId, CreatePaymentExpenseRequestDto request) {
        groupService.validateGroupAccess(AuthUtil.getCurrentUserId(), GroupContext.getGroupId());

        Section section = validatePaymentSection(sectionId);
        validateExpenseRequest(request);

        PaymentExpense expense = new PaymentExpense();
        updateExpenseFromRequest(expense, request, section);
        expense = paymentExpenseRepository.save(expense);

        createShares(expense, request.getShares());

        return expense.getId();
    }

    @Transactional
    public void updateExpense(Long sectionId, Long expenseId, CreatePaymentExpenseRequestDto request) {
        groupService.validateGroupAccess(AuthUtil.getCurrentUserId(), GroupContext.getGroupId());

        validateExpenseRequest(request);

        PaymentExpense expense = paymentExpenseRepository.findById(expenseId)
            .orElseThrow(() -> new BadRequestException("Expense not found"));

        if (!expense.getSection().getId().equals(sectionId)) {
            throw new BadRequestException("Expense does not belong to this section");
        }

        updateExpenseFromRequest(expense, request, null);
        paymentExpenseRepository.save(expense);

        // Replace all existing shares for this expense
        List<PaymentShare> existing = paymentShareRepository.findByExpenseIdAndStatusNot(expenseId, RecordStatus.DELETED);
        paymentShareRepository.deleteAll(existing);

        createShares(expense, request.getShares());
    }

    @Transactional
    public void deleteExpense(Long sectionId, Long expenseId) {
        groupService.validateGroupAccess(AuthUtil.getCurrentUserId(), GroupContext.getGroupId());

        PaymentExpense expense = paymentExpenseRepository.findById(expenseId)
                .orElseThrow(() -> new BadRequestException("Expense not found"));

        if (!expense.getSection().getId().equals(sectionId)) {
            throw new BadRequestException("Expense does not belong to this section");
        }

        expense.setStatus(RecordStatus.DELETED);
        paymentExpenseRepository.save(expense);
    }

    @Transactional(readOnly = true)
    public List<PaymentExpenseDto> getExpenses(Long sectionId) {
        groupService.validateGroupAccess(AuthUtil.getCurrentUserId(), GroupContext.getGroupId());

        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new BadRequestException("Section not found"));
        if (section.getStatus() == RecordStatus.DELETED) {
            return List.of();
        }

        List<PaymentExpense> expenses = paymentExpenseRepository
                .findBySectionIdAndStatusNotOrderByExpenseDateDesc(sectionId, RecordStatus.DELETED);
        List<PaymentShare> allShares = paymentShareRepository
                .findByExpenseSectionIdAndStatusNot(sectionId, RecordStatus.DELETED);

        // Group shares by expense ID for efficient lookup
        Map<Long, List<PaymentShare>> sharesByExpense = allShares.stream()
            .collect(Collectors.groupingBy(share -> share.getExpense().getId()));

        // Map expenses to DTOs using mapper
        return expenses.stream()
                .map(expense -> {
                    PaymentExpenseDto dto = paymentMapper.toPaymentExpenseDto(expense);

                    // Map shares using mapper
                    List<PaymentShareDto> shareDtos = sharesByExpense
                            .getOrDefault(expense.getId(), List.of())
                            .stream()
                            .map(paymentMapper::toPaymentShareDto)
                            .toList();

                    dto.setShares(shareDtos);
                    return dto;
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PaymentBalanceDto> getBalances(Long sectionId) {
        groupService.validateGroupAccess(AuthUtil.getCurrentUserId(), GroupContext.getGroupId());
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new BadRequestException("Section not found"));
        if (section.getStatus() == RecordStatus.DELETED) {
            return List.of();
        }
        List<PaymentExpense> expenses = paymentExpenseRepository.findBySectionIdAndStatusNotOrderByExpenseDateDesc(sectionId, RecordStatus.DELETED);
        List<PaymentShare> allShares = paymentShareRepository.findByExpenseSectionIdAndStatusNot(sectionId, RecordStatus.DELETED);

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

    /**
     * Validates that the section exists, is active, and is a PAYMENT section
     */
    private Section validatePaymentSection(Long sectionId) {
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new BadRequestException("Section not found"));
        if (section.getStatus() == RecordStatus.DELETED) {
            throw new BadRequestException("Section is deleted");
        }
        if (section.getType() != SectionType.PAYMENT) {
            throw new BadRequestException("Cannot add payment expense to non-PAYMENT section");
        }
        return section;
    }

    /**
     * Validates the expense request data (amounts, shares, etc.)
     */
    private void validateExpenseRequest(CreatePaymentExpenseRequestDto request) {
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
        BigDecimal sharesTotal = request.getShares().stream()
                .map(CreatePaymentExpenseRequestDto.ShareInput::getShareAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (sharesTotal.compareTo(request.getTotalAmount()) != 0) {
            throw new BadRequestException("Sum of shares must equal total amount");
        }
    }

    /**
     * Creates or updates expense entity from request DTO
     */
    private void updateExpenseFromRequest(PaymentExpense expense, CreatePaymentExpenseRequestDto request, Section section) {
        User payer = userRepository.getReferenceById(request.getPaidByUserId());

        if (section != null) {
            expense.setSection(section);
        }
        expense.setPaidBy(payer);
        expense.setDescription(request.getDescription());
        expense.setTotalAmount(request.getTotalAmount());
        expense.setCurrency("INR"); // For now we only support INR
        expense.setExpenseDate(request.getExpenseDate());
    }

    /**
     * Creates payment shares for an expense
     */
    private void createShares(PaymentExpense expense, List<CreatePaymentExpenseRequestDto.ShareInput> shareInputs) {
        for (CreatePaymentExpenseRequestDto.ShareInput shareInput : shareInputs) {
            User user = userRepository.getReferenceById(shareInput.getUserId());
            PaymentShare share = new PaymentShare();
            share.setExpense(expense);
            share.setUser(user);
            share.setShareAmount(shareInput.getShareAmount());
            paymentShareRepository.save(share);
        }
    }
}
