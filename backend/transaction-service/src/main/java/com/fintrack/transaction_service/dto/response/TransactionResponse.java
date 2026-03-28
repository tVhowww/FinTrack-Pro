package com.fintrack.transaction_service.dto.response;

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
public class TransactionResponse {
    private String id;
    private BigDecimal amount;
    private TransactionType type;
    private String walletId;
    private String categoryId;
    private String categoryName;
    private String note;
    private Instant date;
    private Instant createdAt;
    private String transferStatus;
}
