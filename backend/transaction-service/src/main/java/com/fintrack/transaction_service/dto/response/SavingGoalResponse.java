package com.fintrack.transaction_service.dto.response;

import com.fintrack.transaction_service.enums.SavingGoalStatus;
import lombok.Builder;
import java.math.BigDecimal;
import java.time.LocalDate;

@Builder
public record SavingGoalResponse(
        String id,
        String name,
        BigDecimal targetAmount,
        BigDecimal currentAmount,
        String currency,
        LocalDate deadline,
        SavingGoalStatus status,
        double percentage
) {}