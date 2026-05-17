package com.fintrack.transaction_service.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WalletBalanceUpdateRequest {
    private BigDecimal amount;
    private String idempotencyKey;
}
