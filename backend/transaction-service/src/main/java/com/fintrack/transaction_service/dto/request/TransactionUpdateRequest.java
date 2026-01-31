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
public class TransactionUpdateRequest {
    private BigDecimal amount;
    private String categoryId;
    private String note;
    private Instant date;
    // Tạm thời KHÔNG cho sửa WalletId và TransactionType để tránh lỗi logic tiền tệ phức tạp
}