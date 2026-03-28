package com.fintrack.transaction_service.enums;

/**
 * Tracks the lifecycle of a Transaction within a transfer Saga.
 * Only used for TRANSFER transactions — regular income/expense have transferStatus = null.
 */
public enum TransferStatus {
    PENDING,       // Debit done, waiting for credit confirmation from wallet-service
    COMPLETED,     // Both debit and credit confirmed — transfer successful
    FAILED,        // Credit failed — awaiting compensation
    COMPENSATED    // Source wallet refunded — saga rolled back
}
