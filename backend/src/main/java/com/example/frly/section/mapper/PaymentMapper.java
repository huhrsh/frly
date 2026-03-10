package com.example.frly.section.mapper;

import com.example.frly.section.dto.PaymentExpenseDto;
import com.example.frly.section.dto.PaymentShareDto;
import com.example.frly.section.dto.PaymentBalanceDto;
import com.example.frly.section.model.PaymentExpense;
import com.example.frly.section.model.PaymentShare;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PaymentMapper {

    @Mapping(target = "sectionId", source = "section.id")
    @Mapping(target = "paidByUserId", source = "paidBy.id")
    @Mapping(target = "paidByFirstName", source = "paidBy.firstName")
    @Mapping(target = "paidByLastName", source = "paidBy.lastName")
    @Mapping(target = "shares", ignore = true) // Manually set in service
    PaymentExpenseDto toPaymentExpenseDto(PaymentExpense expense);

    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "firstName", source = "user.firstName")
    @Mapping(target = "lastName", source = "user.lastName")
    PaymentShareDto toPaymentShareDto(PaymentShare share);

    @Mapping(target = "balance", ignore = true) // Calculated in service
    PaymentBalanceDto toPaymentBalanceDto(Long userId, String firstName, String lastName);
}

