package com.fintrack.wallet_service.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class WalletBalanceAdjustmentRequest {
    @NotNull(message = "Số dư mới không được để trống")
    private BigDecimal newBalance;

    private String note; // Ghi chú lý do điều chỉnh (optional)
}