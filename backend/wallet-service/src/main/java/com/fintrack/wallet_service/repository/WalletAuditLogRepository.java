package com.fintrack.wallet_service.repository;

import com.fintrack.wallet_service.entity.WalletAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WalletAuditLogRepository extends JpaRepository<WalletAuditLog, String> {
}
