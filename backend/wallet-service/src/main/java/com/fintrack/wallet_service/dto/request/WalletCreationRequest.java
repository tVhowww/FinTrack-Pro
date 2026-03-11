package com.fintrack.wallet_service.dto.request;

import com.fintrack.wallet_service.enums.WalletType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WalletCreationRequest {
    @NotBlank(message = "Tên ví không được để trống")
    private String name;

    private String currency;

    @Min(value = 0, message = "INVALID_BALANCE")
    private BigDecimal balance;

    private WalletType type;

    private BigDecimal targetAmount;
    private LocalDate deadline;
}