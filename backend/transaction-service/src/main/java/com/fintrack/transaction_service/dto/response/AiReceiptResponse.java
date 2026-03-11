package com.fintrack.transaction_service.dto.response;

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
public class AiReceiptResponse {
    private BigDecimal amount;
    private String currency;
    private LocalDate date;
    private String note;
    private String categoryId;
    private String type;
}