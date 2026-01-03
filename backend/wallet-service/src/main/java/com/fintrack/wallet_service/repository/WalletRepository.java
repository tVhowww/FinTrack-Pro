package com.fintrack.wallet_service.repository;

import com.fintrack.wallet_service.entity.Wallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WalletRepository extends JpaRepository<Wallet, String> {
    // Kiểm tra ví trùng tên của user đó (Tránh 1 user tạo 2 ví "Tiền mặt")
    boolean existsByUserIdAndName(String userId, String name);
}
