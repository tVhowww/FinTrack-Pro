package com.fintrack.transaction_service.dto.request;

import com.fintrack.transaction_service.enums.TransactionType;
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
public class TransactionCreationRequest {
    private BigDecimal amount;
    private TransactionType type; // INCOME hoặc EXPENSE
    private String walletId;
    private String categoryId;
    private String note;
    private Instant date; // User chọn ngày giao dịch
}
