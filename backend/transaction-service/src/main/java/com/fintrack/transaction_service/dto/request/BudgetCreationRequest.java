package com.fintrack.transaction_service.dto.request;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class BudgetCreationRequest {
    private String name;
    private BigDecimal amount;
    private String walletId;
    private String categoryId;
    private Integer month;
    private Integer year;
}