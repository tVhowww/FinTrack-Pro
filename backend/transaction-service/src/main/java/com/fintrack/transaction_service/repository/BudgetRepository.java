package com.fintrack.transaction_service.repository;

import com.fintrack.transaction_service.entity.Budget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, String> {
    // Lấy danh sách ngân sách của ví trong một tháng cụ thể
    List<Budget> findByWalletIdAndMonthAndYear(String walletId, Integer month, Integer year);

    // Check trùng: Một category trong 1 tháng chỉ được có 1 budget
    Optional<Budget> findByWalletIdAndCategoryIdAndMonthAndYear(String walletId, String categoryId, Integer month, Integer year);
}