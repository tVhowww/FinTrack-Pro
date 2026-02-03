package com.fintrack.transaction_service.repository;

import com.fintrack.transaction_service.entity.Budget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, String> {
    // 1. Validate trùng: Check xem đã có budget nào cho (wallet + category + month + year) chưa
    boolean existsByWalletIdAndCategoryIdAndMonthAndYear(String walletId, String categoryId, Integer month, Integer year);

    // 2. Lấy danh sách cho Global (khi không chọn ví)
    List<Budget> findByWalletIdIsNullAndMonthAndYear(Integer month, Integer year);

    // 3. Lấy danh sách cho ví cụ thể + Global
    @Query("SELECT b FROM Budget b WHERE (b.walletId = :walletId OR b.walletId IS NULL) AND b.month = :month AND b.year = :year")
    List<Budget> findBudgetsForWallet(String walletId, int month, int year);
}