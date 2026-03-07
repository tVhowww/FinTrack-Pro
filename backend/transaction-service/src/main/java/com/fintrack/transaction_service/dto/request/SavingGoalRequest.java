package com.fintrack.transaction_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDate;

public record SavingGoalRequest(
        @NotBlank(message = "Tên mục tiêu không được để trống") String name,
        @NotNull(message = "Số tiền mục tiêu không được để trống") @Positive BigDecimal targetAmount,
        String currency,
        LocalDate deadline
) {}