package com.fintrack.transaction_service.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransferRequest {
    private String fromWalletId;
    private String toWalletId;
    private BigDecimal amount;
    private String categoryId;
    private String note;
    private Instant date;
}