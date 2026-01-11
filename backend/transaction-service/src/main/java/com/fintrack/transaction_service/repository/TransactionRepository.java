package com.fintrack.transaction_service.repository;

import com.fintrack.transaction_service.entity.Transaction;
import com.fintrack.transaction_service.enums.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, String>, JpaSpecificationExecutor<Transaction> {
    // Tìm tất cả giao dịch của 1 ví, sắp xếp ngày tạo giảm dần
    List<Transaction> findByWalletIdOrderByDateDesc(String walletId);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
    "WHERE t.walletId = :walletId " +
    "AND t.type = :type " +
    "AND t.createdAt BETWEEN :startDate AND :endDate")
    BigDecimal sumAmountByWalletAndTypeAndDateBetween(@Param("walletId") String walletId,
                                                      @Param("type") TransactionType type,
                                                      @Param("startDate") Instant startDate,
                                                      @Param("endDate") Instant endDate);
}
