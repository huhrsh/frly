package com.example.frly.section;

import com.example.frly.auth.JwtUserPrincipal;
import com.example.frly.common.enums.RecordStatus;
import com.example.frly.common.exception.BadRequestException;
import com.example.frly.group.GroupContext;
import com.example.frly.group.enums.GroupMemberStatus;
import com.example.frly.group.model.GroupMember;
import com.example.frly.group.repository.GroupMemberRepository;
import com.example.frly.group.service.GroupService;
import com.example.frly.notification.NotificationService;
import com.example.frly.section.dto.CreatePaymentExpenseRequestDto;
import com.example.frly.section.dto.PaymentBalanceDto;
import com.example.frly.section.dto.PaymentExpenseDto;
import com.example.frly.section.mapper.PaymentMapper;
import com.example.frly.section.model.PaymentExpense;
import com.example.frly.section.model.PaymentShare;
import com.example.frly.section.model.Section;
import com.example.frly.section.model.SectionType;
import com.example.frly.section.repository.PaymentExpenseRepository;
import com.example.frly.section.repository.PaymentShareRepository;
import com.example.frly.section.repository.SectionRepository;
import com.example.frly.section.service.PaymentService;
import com.example.frly.user.User;
import com.example.frly.user.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock private GroupService groupService;
    @Mock private SectionRepository sectionRepository;
    @Mock private UserRepository userRepository;
    @Mock private PaymentExpenseRepository paymentExpenseRepository;
    @Mock private PaymentShareRepository paymentShareRepository;
    @Mock private PaymentMapper paymentMapper;
    @Mock private GroupMemberRepository groupMemberRepository;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private PaymentService paymentService;

    private static final Long USER_ID = 10L;
    private static final String GROUP_ID = "1";

    @BeforeEach
    void setUp() {
        JwtUserPrincipal principal = new JwtUserPrincipal(USER_ID, "user@example.com");
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(principal, null, Collections.emptyList())
        );
        GroupContext.setGroupId(GROUP_ID);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        GroupContext.clear();
    }

    // ─── validateExpenseRequest ───────────────────────────────────────────────

    @Test
    void addExpense_withNullAmount_throwsBadRequest() {
        Section section = buildPaymentSection(1L);
        when(sectionRepository.findById(1L)).thenReturn(Optional.of(section));

        CreatePaymentExpenseRequestDto req = new CreatePaymentExpenseRequestDto();
        req.setTotalAmount(null);
        req.setPaidByUserId(USER_ID);
        req.setShares(List.of());

        assertThrows(BadRequestException.class, () -> paymentService.addExpense(1L, req));
    }

    @Test
    void addExpense_withZeroAmount_throwsBadRequest() {
        Section section = buildPaymentSection(1L);
        when(sectionRepository.findById(1L)).thenReturn(Optional.of(section));

        CreatePaymentExpenseRequestDto req = new CreatePaymentExpenseRequestDto();
        req.setTotalAmount(BigDecimal.ZERO);
        req.setPaidByUserId(USER_ID);
        req.setShares(List.of());

        assertThrows(BadRequestException.class, () -> paymentService.addExpense(1L, req));
    }

    @Test
    void addExpense_withNoShares_throwsBadRequest() {
        Section section = buildPaymentSection(1L);
        when(sectionRepository.findById(1L)).thenReturn(Optional.of(section));

        CreatePaymentExpenseRequestDto req = new CreatePaymentExpenseRequestDto();
        req.setTotalAmount(new BigDecimal("10.00"));
        req.setPaidByUserId(USER_ID);
        req.setShares(Collections.emptyList());

        assertThrows(BadRequestException.class, () -> paymentService.addExpense(1L, req));
    }

    @Test
    void addExpense_withShareSumMismatch_throwsBadRequest() {
        Section section = buildPaymentSection(1L);
        when(sectionRepository.findById(1L)).thenReturn(Optional.of(section));

        CreatePaymentExpenseRequestDto.ShareInput share = new CreatePaymentExpenseRequestDto.ShareInput();
        share.setUserId(2L);
        share.setShareAmount(new BigDecimal("6.00")); // totalAmount is 10, share is 6 → mismatch

        CreatePaymentExpenseRequestDto req = new CreatePaymentExpenseRequestDto();
        req.setTotalAmount(new BigDecimal("10.00"));
        req.setPaidByUserId(USER_ID);
        req.setShares(List.of(share));

        assertThrows(BadRequestException.class, () -> paymentService.addExpense(1L, req));
    }

    @Test
    void addExpense_toNonPaymentSection_throwsBadRequest() {
        Section listSection = new Section();
        listSection.setId(1L);
        listSection.setType(SectionType.LIST);
        listSection.setStatus(RecordStatus.ACTIVE);
        listSection.setGroupId(GROUP_ID);

        when(sectionRepository.findById(1L)).thenReturn(Optional.of(listSection));

        CreatePaymentExpenseRequestDto req = validExpenseRequest(new BigDecimal("10.00"), USER_ID, 2L);
        assertThrows(BadRequestException.class, () -> paymentService.addExpense(1L, req));
    }

    // ─── addExpense ───────────────────────────────────────────────────────────

    @Test
    void addExpense_success_savesExpenseAndSharesAndReturnsId() {
        Section section = buildPaymentSection(1L);
        PaymentExpense savedExpense = buildExpense(7L, buildUser(USER_ID), section, new BigDecimal("10.00"));

        when(sectionRepository.findById(1L)).thenReturn(Optional.of(section));
        when(paymentExpenseRepository.save(any(PaymentExpense.class))).thenReturn(savedExpense);
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser(USER_ID)));
        when(userRepository.getReferenceById(anyLong())).thenReturn(buildUser(2L));

        CreatePaymentExpenseRequestDto req = validExpenseRequest(new BigDecimal("10.00"), USER_ID, 2L);

        Long id = paymentService.addExpense(1L, req);

        assertEquals(7L, id);
        verify(paymentExpenseRepository).save(any(PaymentExpense.class));
        verify(paymentShareRepository).save(any(PaymentShare.class));
    }

    // ─── deleteExpense ────────────────────────────────────────────────────────

    @Test
    void deleteExpense_softDeletesExpense() {
        Section section = buildPaymentSection(1L);
        PaymentExpense expense = buildExpense(3L, buildUser(USER_ID), section, new BigDecimal("50.00"));

        when(paymentExpenseRepository.findById(3L)).thenReturn(Optional.of(expense));
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser(USER_ID)));

        paymentService.deleteExpense(1L, 3L);

        assertEquals(RecordStatus.DELETED, expense.getStatus());
        verify(paymentExpenseRepository).save(expense);
    }

    @Test
    void deleteExpense_expenseInDifferentSection_throwsBadRequest() {
        Section section = buildPaymentSection(1L);
        Section otherSection = buildPaymentSection(99L);
        PaymentExpense expense = buildExpense(3L, buildUser(USER_ID), otherSection, new BigDecimal("10.00"));

        when(paymentExpenseRepository.findById(3L)).thenReturn(Optional.of(expense));

        assertThrows(BadRequestException.class, () -> paymentService.deleteExpense(1L, 3L));
        verify(paymentExpenseRepository, never()).save(any());
    }

    @Test
    void deleteExpense_whenNotFound_throwsBadRequest() {
        when(paymentExpenseRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(BadRequestException.class, () -> paymentService.deleteExpense(1L, 99L));
    }

    // ─── getExpenses ─────────────────────────────────────────────────────────

    @Test
    void getExpenses_returnsMappedExpensesWithShares() {
        Section section = buildPaymentSection(1L);
        PaymentExpense expense = buildExpense(1L, buildUser(USER_ID), section, new BigDecimal("20.00"));
        PaymentShare share = buildShare(1L, buildUser(2L), expense, new BigDecimal("20.00"));
        PaymentExpenseDto expenseDto = new PaymentExpenseDto();

        when(sectionRepository.findById(1L)).thenReturn(Optional.of(section));
        when(paymentExpenseRepository.findBySectionIdAndStatusNotOrderByExpenseDateDesc(1L, RecordStatus.DELETED))
            .thenReturn(List.of(expense));
        when(paymentShareRepository.findByExpenseSectionIdAndStatusNot(1L, RecordStatus.DELETED))
            .thenReturn(List.of(share));
        when(paymentMapper.toPaymentExpenseDto(expense)).thenReturn(expenseDto);
        when(paymentMapper.toPaymentShareDto(share)).thenReturn(new com.example.frly.section.dto.PaymentShareDto());

        List<PaymentExpenseDto> result = paymentService.getExpenses(1L);

        assertEquals(1, result.size());
        verify(paymentMapper).toPaymentExpenseDto(expense);
    }

    @Test
    void getExpenses_forDeletedSection_returnsEmptyList() {
        Section section = buildPaymentSection(1L);
        section.setStatus(RecordStatus.DELETED);
        when(sectionRepository.findById(1L)).thenReturn(Optional.of(section));

        List<PaymentExpenseDto> result = paymentService.getExpenses(1L);

        assertTrue(result.isEmpty());
        verify(paymentExpenseRepository, never()).findBySectionIdAndStatusNotOrderByExpenseDateDesc(any(), any());
    }

    // ─── getBalances ─────────────────────────────────────────────────────────

    @Test
    void getBalances_calculatesCreditorAndDebtorCorrectly() {
        User userA = buildUser(1L);
        User userB = buildUser(2L);
        Section section = buildPaymentSection(1L);

        GroupMember mA = buildGroupMember(userA);
        GroupMember mB = buildGroupMember(userB);

        // A paid 10, B owes 10 → A balance = +10, B balance = -10
        PaymentExpense expense = buildExpense(1L, userA, section, new BigDecimal("10.00"));
        PaymentShare share = buildShare(1L, userB, expense, new BigDecimal("10.00"));

        when(sectionRepository.findById(1L)).thenReturn(Optional.of(section));
        when(groupMemberRepository.findByGroupIdAndStatus(1L, GroupMemberStatus.APPROVED))
            .thenReturn(List.of(mA, mB));
        when(paymentExpenseRepository.findBySectionIdAndStatusNotOrderByExpenseDateDesc(1L, RecordStatus.DELETED))
            .thenReturn(List.of(expense));
        when(paymentShareRepository.findByExpenseSectionIdAndStatusNot(1L, RecordStatus.DELETED))
            .thenReturn(List.of(share));

        List<PaymentBalanceDto> balances = paymentService.getBalances(1L);

        Map<Long, BigDecimal> byUser = balances.stream()
            .collect(Collectors.toMap(PaymentBalanceDto::getUserId, PaymentBalanceDto::getBalance));

        assertEquals(new BigDecimal("10.00"), byUser.get(1L));  // A is owed money
        assertEquals(new BigDecimal("-10.00"), byUser.get(2L)); // B owes money
    }

    @Test
    void getBalances_excludesRemovedGroupMembers() {
        User userA = buildUser(1L); // active member
        // userB (id=2) is not in the group members list
        Section section = buildPaymentSection(1L);

        GroupMember mA = buildGroupMember(userA);

        User userB = buildUser(2L);
        PaymentExpense expense = buildExpense(1L, userA, section, new BigDecimal("10.00"));
        PaymentShare share = buildShare(1L, userB, expense, new BigDecimal("10.00"));

        when(sectionRepository.findById(1L)).thenReturn(Optional.of(section));
        when(groupMemberRepository.findByGroupIdAndStatus(1L, GroupMemberStatus.APPROVED))
            .thenReturn(List.of(mA)); // only A is active
        when(paymentExpenseRepository.findBySectionIdAndStatusNotOrderByExpenseDateDesc(1L, RecordStatus.DELETED))
            .thenReturn(List.of(expense));
        when(paymentShareRepository.findByExpenseSectionIdAndStatusNot(1L, RecordStatus.DELETED))
            .thenReturn(List.of(share));

        List<PaymentBalanceDto> balances = paymentService.getBalances(1L);

        // B's share should be excluded since B is not an active member
        Map<Long, BigDecimal> byUser = balances.stream()
            .collect(Collectors.toMap(PaymentBalanceDto::getUserId, PaymentBalanceDto::getBalance));

        assertTrue(byUser.containsKey(1L));
        assertFalse(byUser.containsKey(2L));
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private Section buildPaymentSection(Long id) {
        Section s = new Section();
        s.setId(id);
        s.setTitle("Expenses");
        s.setType(SectionType.PAYMENT);
        s.setStatus(RecordStatus.ACTIVE);
        s.setGroupId(GROUP_ID);
        return s;
    }

    private User buildUser(Long id) {
        User u = new User();
        u.setId(id);
        u.setFirstName("User" + id);
        u.setLastName("Test");
        u.setEmail("user" + id + "@example.com");
        return u;
    }

    private PaymentExpense buildExpense(Long id, User paidBy, Section section, BigDecimal amount) {
        PaymentExpense e = new PaymentExpense();
        e.setId(id);
        e.setPaidBy(paidBy);
        e.setSection(section);
        e.setTotalAmount(amount);
        e.setExpenseType("NORMAL");
        e.setStatus(RecordStatus.ACTIVE);
        e.setGroupId(GROUP_ID);
        return e;
    }

    private PaymentShare buildShare(Long id, User user, PaymentExpense expense, BigDecimal amount) {
        PaymentShare s = new PaymentShare();
        s.setId(id);
        s.setUser(user);
        s.setExpense(expense);
        s.setShareAmount(amount);
        s.setStatus(RecordStatus.ACTIVE);
        return s;
    }

    private GroupMember buildGroupMember(User user) {
        GroupMember m = new GroupMember();
        m.setUser(user);
        m.setStatus(GroupMemberStatus.APPROVED);
        return m;
    }

    /** Builds a valid expense request where shares sum exactly equals totalAmount */
    private CreatePaymentExpenseRequestDto validExpenseRequest(BigDecimal total, Long payerId, Long shareUserId) {
        CreatePaymentExpenseRequestDto.ShareInput share = new CreatePaymentExpenseRequestDto.ShareInput();
        share.setUserId(shareUserId);
        share.setShareAmount(total);

        CreatePaymentExpenseRequestDto req = new CreatePaymentExpenseRequestDto();
        req.setTotalAmount(total);
        req.setPaidByUserId(payerId);
        req.setShares(List.of(share));
        return req;
    }
}
