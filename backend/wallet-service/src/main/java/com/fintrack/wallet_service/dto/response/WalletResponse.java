package com.fintrack.wallet_service.dto.response;

import com.fintrack.wallet_service.enums.WalletType;
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
public class WalletResponse {
    private String id;
    private String name;
    private BigDecimal balance;
    private String currency;
    private String userId;

    private WalletType type;
    private BigDecimal targetAmount;
    private LocalDate deadline;

    private Double percentage;
}