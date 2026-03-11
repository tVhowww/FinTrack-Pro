package com.fintrack.wallet_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class WalletUpdateRequest {
    @NotBlank(message = "WALLET_NAME_INVALID")
    private String name;

    private String currency;

    private BigDecimal targetAmount;
    private LocalDate deadline;
}