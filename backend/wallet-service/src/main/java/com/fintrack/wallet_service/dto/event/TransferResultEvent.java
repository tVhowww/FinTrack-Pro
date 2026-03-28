package com.fintrack.wallet_service.dto.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Published to "transfer.credit-completed" or "transfer.credit-failed".
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransferResultEvent {
    private String sagaId;
    private boolean success;
    private String reason;
}
