package com.fintrack.transaction_service.dto.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Published by wallet-service to either "transfer.credit-completed" or "transfer.credit-failed".
 * Consumed by transaction-service to finalize the saga.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransferResultEvent {
    private String sagaId;
    private boolean success;
    private String reason;    // null on success, error description on failure
}
