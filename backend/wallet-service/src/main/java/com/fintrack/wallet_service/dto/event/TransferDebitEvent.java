package com.fintrack.wallet_service.dto.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Consumed from "transfer.debit-completed" topic.
 * Contains all information needed to credit the target wallet.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransferDebitEvent {
    private String sagaId;
    private String fromWalletId;
    private String toWalletId;
    private BigDecimal amount;
    private String note;
    private Instant date;
}
