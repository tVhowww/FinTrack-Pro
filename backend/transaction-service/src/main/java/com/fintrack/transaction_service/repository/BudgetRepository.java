package com.fintrack.transaction_service.repository;

import com.fintrack.transaction_service.entity.Budget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, String>, JpaSpecificationExecutor<Budget> {
    boolean existsByWalletIdAndCategoryIdAndMonthAndYearAndUserId(String walletId, String categoryId, Integer month, Integer year, String userId);

    // 1. Cho "Ví chung" (Global): Chỉ lấy budget có walletId IS NULL
    List<Budget> findByWalletIdIsNullAndMonthAndYearAndUserId(Integer month, Integer year, String userId);

    // 2. Cho "Tất cả các ví" (All): Lấy TẤT CẢ (không quan tâm ví nào)
    List<Budget> findByMonthAndYearAndUserId(Integer month, Integer year, String userId);

    // 3. Cho "Ví cụ thể": Lấy của ví đó + Ví chung
    @Query("SELECT b FROM Budget b WHERE (b.walletId = :walletId) AND b.month = :month AND b.year = :year AND b.userId = :userId")
    List<Budget> findBudgetsForWallet(String walletId, int month, int year, String userId);

    Optional<Budget> findByIdAndUserId(String id, String userId);

    @Modifying
    @Query("DELETE FROM Budget b WHERE b.userId = :userId")
    void deleteByUserId(String userId);
}