package com.fintrack.transaction_service.dto.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Published to "transfer.debit-completed" after the source wallet is debited.
 * Consumed by wallet-service to credit the target wallet.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransferDebitEvent {
    private String sagaId;          // Links debit + credit Transaction records
    private String fromWalletId;
    private String toWalletId;
    private BigDecimal amount;
    private String note;
    private Instant date;
}
