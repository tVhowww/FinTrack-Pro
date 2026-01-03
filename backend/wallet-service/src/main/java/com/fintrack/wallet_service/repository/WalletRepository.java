package com.fintrack.wallet_service.repository;

import com.fintrack.wallet_service.entity.Wallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WalletRepository extends JpaRepository<Wallet, String> {
    // Kiểm tra ví trùng tên của user đó (Tránh 1 user tạo 2 ví "Tiền mặt")
    boolean existsByUserIdAndName(String userId, String name);

    // Tìm ví của user và chưa bị xóa (Sắp xếp mới nhất lên đầu)
    List<Wallet> findByUserIdAndIsActiveTrueOrderByCreatedAtDesc(String userId);

    // Tìm ví theo ID và UserID (Quan trọng để check quyền sở hữu)
    Optional<Wallet> findByIdAndUserId(String id, String userId);
}
