package com.fintrack.transaction_service.repository;

import com.fintrack.transaction_service.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, String>, JpaSpecificationExecutor<Transaction> {
    // Tìm tất cả giao dịch của 1 ví, sắp xếp ngày tạo giảm dần
    List<Transaction> findByWalletIdOrderByDateDesc(String walletId);
}
