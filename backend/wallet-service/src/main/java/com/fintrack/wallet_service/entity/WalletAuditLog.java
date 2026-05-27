package com.fintrack.wallet_service.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "wallet_audit_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WalletAuditLog {
    @Id
    @Builder.Default
    private String id = UUID.randomUUID().toString();
    
    private String walletId;
    
    private BigDecimal previousBalance;
    
    private BigDecimal newBalance;
    
    private BigDecimal amount;
    
    private String transactionType;
    
    private String referenceId;
    
    @Builder.Default
    private Instant createdAt = Instant.now();
}
