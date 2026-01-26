package com.fintrack.wallet_service.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WalletCreationRequest {
    @NotBlank(message = "Tên ví không được để trống")
    private String name;

    private String currency;

    @Min(value = 0, message = "INVALID_BALANCE") // Số dư >= 0
    private BigDecimal balance;
}
