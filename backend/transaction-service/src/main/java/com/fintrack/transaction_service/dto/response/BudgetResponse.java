package com.fintrack.transaction_service.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class BudgetResponse {
    private String id;
    private String name;
    private BigDecimal amount;
    private BigDecimal spentAmount;
    private double percentage;
    private String walletId;
    private String categoryId;
    private String categoryName;
    private Integer month;
    private Integer year;
}