package com.fintrack.transaction_service.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record FundAddRequest(
        @NotNull(message = "Số tiền nạp không được để trống") @Positive BigDecimal amount
) {}