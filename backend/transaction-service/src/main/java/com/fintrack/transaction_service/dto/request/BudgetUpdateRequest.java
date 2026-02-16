package com.fintrack.transaction_service.dto.request;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class BudgetUpdateRequest {
    private String name;
    private BigDecimal amount;
}