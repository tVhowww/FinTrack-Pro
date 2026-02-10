package com.fintrack.transaction_service.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class BalanceTrendResponse {
    private int month;
    private int year;
    private BigDecimal income;  // Tổng thu
    private BigDecimal expense; // Tổng chi
    private BigDecimal netSavings; // Số dư (Thu - Chi)
}