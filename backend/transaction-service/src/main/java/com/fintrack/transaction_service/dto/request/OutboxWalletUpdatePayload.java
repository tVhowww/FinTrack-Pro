package com.fintrack.transaction_service.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OutboxWalletUpdatePayload {
    private String walletId;
    private WalletBalanceUpdateRequest request;
}
