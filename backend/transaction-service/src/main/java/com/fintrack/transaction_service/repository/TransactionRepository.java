package com.fintrack.transaction_service.repository;

import com.fintrack.transaction_service.entity.Transaction;
import com.fintrack.transaction_service.enums.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
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

    long countByWalletId(String walletId);

    long countByCategoryIdInAndDeletedFalse(List<String> categoryIds);

    @Modifying
    @Query("UPDATE Transaction t SET t.deleted = true WHERE t.category.id IN :categoryIds")
    void softDeleteByCategoryIds(List<String> categoryIds);

    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.walletId = :walletId AND t.category.id = :categoryId AND t.type = 'EXPENSE' AND t.date BETWEEN :startDate AND :endDate")
    BigDecimal sumAmountByWalletAndCategoryAndTypeAndDateBetween(String walletId, String categoryId, Instant startDate, Instant endDate);

    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.category.id = :categoryId AND t.type = 'EXPENSE' AND t.date BETWEEN :startDate AND :endDate")
    BigDecimal sumAmountByCategoryAndTypeAndDateBetween(String categoryId, Instant startDate, Instant endDate);

    // Statistics
    // 1. Tính tổng tiền (Dùng IN thay vì = )
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
            "WHERE t.walletId IN :walletIds " +  // <-- QUAN TRỌNG: Chỉ lấy trong danh sách ví được cấp phép
            "AND t.type = :type " +
            "AND t.date BETWEEN :startDate AND :endDate")
    BigDecimal sumAmountByWalletIdInAndTypeAndDate(
            @Param("walletIds") List<String> walletIds,
            @Param("type") TransactionType type,
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate
    );

    // 2. Cơ cấu chi tiêu
    @Query("SELECT t.category, SUM(t.amount) FROM Transaction t " +
            "WHERE t.walletId IN :walletIds " +
            "AND t.type = 'EXPENSE' " +
            "AND t.date BETWEEN :startDate AND :endDate " +
            "GROUP BY t.category")
    List<Object[]> findExpenseStructureByWalletIds(
            @Param("walletIds") List<String> walletIds,
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate
    );

    // 3. Top chi tiêu
    @Query("SELECT t FROM Transaction t " +
            "WHERE t.walletId IN :walletIds " +
            "AND t.type = 'EXPENSE' " +
            "AND t.date BETWEEN :startDate AND :endDate " +
            "ORDER BY ABS(t.amount) DESC " +
            "LIMIT 5")
    List<Transaction> findHighestExpensesByWalletIds(
            @Param("walletIds") List<String> walletIds,
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate
    );

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
            "WHERE t.walletId IN :walletIds " +
            "AND t.category.id = :categoryId " +
            "AND t.type = 'EXPENSE' " +
            "AND t.date BETWEEN :startDate AND :endDate")
    BigDecimal sumExpenseByCategoryAndDate(
            @Param("walletIds") List<String> walletIds,
            @Param("categoryId") String categoryId,
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate
    );
}
