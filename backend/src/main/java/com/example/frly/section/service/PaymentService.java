package com.example.frly.section.service;

import com.example.frly.auth.AuthUtil;
import com.example.frly.common.enums.RecordStatus;
import com.example.frly.common.exception.BadRequestException;
import com.example.frly.group.GroupContext;
import com.example.frly.group.enums.GroupMemberStatus;
import com.example.frly.group.model.GroupMember;
import com.example.frly.group.repository.GroupMemberRepository;
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
import com.example.frly.activity.ActivityLogService;
import com.example.frly.activity.ActivityType;
import com.example.frly.notification.NotificationService;
import com.example.frly.notification.NotificationType;
import com.example.frly.user.User;
import com.example.frly.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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
    private final GroupMemberRepository groupMemberRepository;
    private final NotificationService notificationService;
    private final ActivityLogService activityLogService;

    private String getFullName(User user) {
        if (user == null) {
            return "Unknown User";
        }
        String firstName = user.getFirstName() != null ? user.getFirstName() : "";
        String lastName = user.getLastName() != null ? " " + user.getLastName() : "";
        String fullName = (firstName + lastName).trim();
        return fullName.isEmpty() ? user.getEmail() : fullName;
    }

    @Transactional
    public Long addExpense(Long sectionId, CreatePaymentExpenseRequestDto request) {
        groupService.validateNotViewer(AuthUtil.getCurrentUserId(), Long.parseLong(GroupContext.getGroupId()));

        Section section = validatePaymentSection(sectionId);
        validateExpenseRequest(request);

        PaymentExpense expense = new PaymentExpense();
        updateExpenseFromRequest(expense, request, section);
        expense = paymentExpenseRepository.save(expense);

        createShares(expense, request.getShares());
        
        // Notify group members
        User currentUser = userRepository.findById(AuthUtil.getCurrentUserId()).orElse(null);
        String actorName = currentUser != null ? getFullName(currentUser) : "Someone";
        String amountStr = String.format("₹%.2f", expense.getTotalAmount());
        Long groupId = Long.valueOf(section.getGroupId());
        notificationService.notifyGroupMembers(
            groupId,
            section.getId(),
            NotificationType.PAYMENT_ADDED,
            "New expense in " + section.getTitle(),
            actorName + " added " + amountStr + (expense.getDescription() != null ? " for " + expense.getDescription() : ""),
            actorName,
            "PAYMENT"
        );
        activityLogService.log(section.getGroupId(), AuthUtil.getCurrentUserId(), actorName,
                currentUser != null ? currentUser.getPfpUrl() : null,
                ActivityType.EXPENSE_ADDED,
                amountStr + (expense.getDescription() != null ? " – " + expense.getDescription() : ""),
                section.getId(), section.getTitle());

        return expense.getId();
    }

    @Transactional
    public void updateExpense(Long sectionId, Long expenseId, CreatePaymentExpenseRequestDto request) {
        groupService.validateNotViewer(AuthUtil.getCurrentUserId(), Long.parseLong(GroupContext.getGroupId()));

        validateExpenseRequest(request);

        PaymentExpense expense = paymentExpenseRepository.findById(expenseId)
            .orElseThrow(() -> new BadRequestException("Expense not found"));

        if (!expense.getSection().getId().equals(sectionId)) {
            throw new BadRequestException("Expense does not belong to this section");
        }

        updateExpenseFromRequest(expense, request, null);
        paymentExpenseRepository.save(expense);
        
        // Notify group members
        Section section = expense.getSection();
        User currentUser = userRepository.findById(AuthUtil.getCurrentUserId()).orElse(null);
        String actorName = currentUser != null ? getFullName(currentUser) : "Someone";
        String amountStr = String.format("₹%.2f", expense.getTotalAmount());
        Long groupId = Long.valueOf(section.getGroupId());
        notificationService.notifyGroupMembers(
            groupId,
            section.getId(),
            NotificationType.PAYMENT_UPDATED,
            "Expense updated in " + section.getTitle(),
            actorName + " updated expense: " + amountStr + (expense.getDescription() != null ? " - " + expense.getDescription() : ""),
            actorName,
            "PAYMENT"
        );

        // Replace all existing shares for this expense
        List<PaymentShare> existing = paymentShareRepository.findByExpenseIdAndStatusNot(expenseId, RecordStatus.DELETED);
        paymentShareRepository.deleteAll(existing);

        createShares(expense, request.getShares());
    }

    @Transactional
    public void deleteExpense(Long sectionId, Long expenseId) {
        groupService.validateNotViewer(AuthUtil.getCurrentUserId(), Long.parseLong(GroupContext.getGroupId()));

        PaymentExpense expense = paymentExpenseRepository.findById(expenseId)
                .orElseThrow(() -> new BadRequestException("Expense not found"));

        if (!expense.getSection().getId().equals(sectionId)) {
            throw new BadRequestException("Expense does not belong to this section");
        }

        expense.setStatus(RecordStatus.DELETED);
        paymentExpenseRepository.save(expense);
        
        // Notify group members
        Section section = expense.getSection();
        User currentUser = userRepository.findById(AuthUtil.getCurrentUserId()).orElse(null);
        String actorName = currentUser != null ? getFullName(currentUser) : "Someone";
        String amountStr = String.format("₹%.2f", expense.getTotalAmount());
        Long groupId = Long.valueOf(section.getGroupId());
        notificationService.notifyGroupMembers(
            groupId,
            section.getId(),
            NotificationType.PAYMENT_DELETED,
            "Expense deleted in " + section.getTitle(),
            actorName + " deleted expense: " + amountStr + (expense.getDescription() != null ? " - " + expense.getDescription() : ""),
            actorName
        );
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

        Map<Long, List<PaymentShare>> sharesByExpense = allShares.stream()
                .collect(Collectors.groupingBy(share -> share.getExpense().getId()));

        return expenses.stream()
                .map(expense -> {
                    PaymentExpenseDto dto = paymentMapper.toPaymentExpenseDto(expense);
                    List<PaymentShareDto> shareDtos = sharesByExpense.getOrDefault(expense.getId(), List.of())
                            .stream()
                            .map(paymentMapper::toPaymentShareDto)
                            .collect(Collectors.toList());
                    dto.setShares(shareDtos);
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<PaymentExpenseDto> getExpensesPaged(Long sectionId, int page, int size) {
        return getExpensesPaged(sectionId, null, page, size);
    }

    @Transactional(readOnly = true)
    public Page<PaymentExpenseDto> getExpensesPaged(Long sectionId, Long userId, int page, int size) {
        groupService.validateGroupAccess(AuthUtil.getCurrentUserId(), GroupContext.getGroupId());

        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new BadRequestException("Section not found"));

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        if (section.getStatus() == RecordStatus.DELETED) {
            return Page.empty(pageable);
        }

        Page<PaymentExpense> expensesPage = (userId != null)
                ? paymentExpenseRepository.findBySectionIdAndUserId(sectionId, userId, RecordStatus.DELETED, pageable)
                : paymentExpenseRepository.findBySectionIdAndStatusNot(sectionId, RecordStatus.DELETED, pageable);
        List<PaymentShare> allShares = paymentShareRepository
                .findByExpenseSectionIdAndStatusNot(sectionId, RecordStatus.DELETED);

        Map<Long, List<PaymentShare>> sharesByExpense = allShares.stream()
                .collect(Collectors.groupingBy(share -> share.getExpense().getId()));

        return expensesPage.map(expense -> {
            PaymentExpenseDto dto = paymentMapper.toPaymentExpenseDto(expense);
            List<PaymentShareDto> shareDtos = sharesByExpense.getOrDefault(expense.getId(), List.of())
                    .stream()
                    .map(paymentMapper::toPaymentShareDto)
                    .collect(Collectors.toList());
            dto.setShares(shareDtos);
            return dto;
        });
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalNormalExpenses(Long sectionId) {
        groupService.validateGroupAccess(AuthUtil.getCurrentUserId(), GroupContext.getGroupId());

        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new BadRequestException("Section not found"));
        if (section.getStatus() == RecordStatus.DELETED) {
            return BigDecimal.ZERO;
        }

        return paymentExpenseRepository
                .sumBySectionIdAndStatusNotAndExpenseTypeNot(sectionId, RecordStatus.DELETED, "SETTLEMENT");
    }

    @Transactional(readOnly = true)
    public List<PaymentBalanceDto> getBalances(Long sectionId) {
        groupService.validateGroupAccess(AuthUtil.getCurrentUserId(), GroupContext.getGroupId());

        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new BadRequestException("Section not found"));
        if (section.getStatus() == RecordStatus.DELETED) {
            return List.of();
        }

        Long groupId = Long.valueOf(section.getGroupId());
        Set<Long> activeUserIds = groupMemberRepository.findByGroupIdAndStatus(groupId, GroupMemberStatus.APPROVED)
                .stream()
                .map(m -> m.getUser().getId())
                .collect(Collectors.toSet());

        List<PaymentExpense> expenses = paymentExpenseRepository
                .findBySectionIdAndStatusNotOrderByExpenseDateDesc(sectionId, RecordStatus.DELETED);
        List<PaymentShare> allShares = paymentShareRepository
                .findByExpenseSectionIdAndStatusNot(sectionId, RecordStatus.DELETED);

        Map<Long, List<PaymentShare>> sharesByExpense = allShares.stream()
                .collect(Collectors.groupingBy(share -> share.getExpense().getId()));

        Map<Long, PaymentBalanceDto> balances = new HashMap<>();

        for (PaymentExpense expense : expenses) {
            Long payerId = expense.getPaidBy().getId();
            if (activeUserIds.contains(payerId)) {
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
            }

            List<PaymentShare> shares = sharesByExpense.getOrDefault(expense.getId(), List.of());
            for (PaymentShare share : shares) {
                Long userId = share.getUser().getId();
                if (!activeUserIds.contains(userId)) {
                    continue;
                }
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
        if (expense.getExpenseType() == null) {
            expense.setExpenseType("NORMAL");
        }
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

    @Transactional
    public void settleSection(Long sectionId) {
        groupService.validateNotViewer(AuthUtil.getCurrentUserId(), Long.parseLong(GroupContext.getGroupId()));

        Section section = validatePaymentSection(sectionId);

        Long groupId = Long.valueOf(section.getGroupId());
        Set<Long> activeUserIds = groupMemberRepository.findByGroupIdAndStatus(groupId, GroupMemberStatus.APPROVED)
            .stream()
            .map(m -> m.getUser().getId())
            .collect(Collectors.toSet());

        // Compute current balances
        List<PaymentExpense> expenses = paymentExpenseRepository
                .findBySectionIdAndStatusNotOrderByExpenseDateDesc(sectionId, RecordStatus.DELETED);
        List<PaymentShare> allShares = paymentShareRepository
                .findByExpenseSectionIdAndStatusNot(sectionId, RecordStatus.DELETED);

        Map<Long, List<PaymentShare>> sharesByExpense = allShares.stream()
                .collect(Collectors.groupingBy(share -> share.getExpense().getId()));

        Map<Long, BigDecimal> balances = new HashMap<>();

        for (PaymentExpense expense : expenses) {
            Long payerId = expense.getPaidBy().getId();
            if (activeUserIds.contains(payerId)) {
                balances.putIfAbsent(payerId, BigDecimal.ZERO);
                balances.put(payerId, balances.get(payerId).add(expense.getTotalAmount()));
            }

            List<PaymentShare> shares = sharesByExpense.getOrDefault(expense.getId(), List.of());
            for (PaymentShare share : shares) {
                Long userId = share.getUser().getId();
                if (!activeUserIds.contains(userId)) {
                    continue;
                }
                balances.putIfAbsent(userId, BigDecimal.ZERO);
                balances.put(userId, balances.get(userId).subtract(share.getShareAmount()));
            }
        }

        List<Map.Entry<Long, BigDecimal>> creditors = balances.entrySet().stream()
                .filter(e -> e.getValue().compareTo(BigDecimal.ZERO) > 0)
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .collect(Collectors.toList());

        List<Map.Entry<Long, BigDecimal>> debtors = balances.entrySet().stream()
                .filter(e -> e.getValue().compareTo(BigDecimal.ZERO) < 0)
                .sorted((a, b) -> a.getValue().compareTo(b.getValue()))
                .collect(Collectors.toList());

        int ci = 0;
        int di = 0;

        while (ci < creditors.size() && di < debtors.size()) {
            Map.Entry<Long, BigDecimal> cred = creditors.get(ci);
            Map.Entry<Long, BigDecimal> debt = debtors.get(di);

            BigDecimal credAmt = cred.getValue();
            BigDecimal debtAmt = debt.getValue().abs();

            BigDecimal transfer = credAmt.min(debtAmt);
            if (transfer.compareTo(BigDecimal.ZERO) <= 0) {
                break;
            }

            // Debtor pays creditor via a settlement expense
            PaymentExpense settlement = new PaymentExpense();
            settlement.setSection(section);
            settlement.setPaidBy(userRepository.getReferenceById(debt.getKey()));
            settlement.setDescription("Settlement");
            settlement.setTotalAmount(transfer);
            settlement.setCurrency("INR");
            settlement.setExpenseDate(java.time.OffsetDateTime.now());
            settlement.setExpenseType("SETTLEMENT");

            settlement = paymentExpenseRepository.save(settlement);

            PaymentShare share = new PaymentShare();
            share.setExpense(settlement);
            share.setUser(userRepository.getReferenceById(cred.getKey()));
            share.setShareAmount(transfer);
            paymentShareRepository.save(share);

            cred.setValue(credAmt.subtract(transfer));
            debt.setValue(debt.getValue().add(transfer));

            if (cred.getValue().compareTo(BigDecimal.ZERO) <= 0) {
                ci++;
            }
            if (debt.getValue().compareTo(BigDecimal.ZERO) >= 0) {
                di++;
            }
        }
    }
}
