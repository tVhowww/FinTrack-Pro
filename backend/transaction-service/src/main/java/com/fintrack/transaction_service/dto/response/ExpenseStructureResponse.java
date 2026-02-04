package com.fintrack.transaction_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseStructureResponse {
    private String categoryId;
    private String categoryName;
    private BigDecimal amount;
    private double percentage;
}