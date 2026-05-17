package com.fintrack.wallet_service.repository;

import com.fintrack.wallet_service.entity.Wallet;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface WalletRepository extends JpaRepository<Wallet, String>, JpaSpecificationExecutor<Wallet> {
    // Kiểm tra ví trùng tên của user đó (Tránh 1 user tạo 2 ví "Tiền mặt")
    boolean existsByNameIgnoreCaseAndUserIdAndIsActive(String name, String userId, boolean isActive);

    // Tìm ví của user và chưa bị xóa (Sắp xếp mới nhất lên đầu)
    List<Wallet> findByUserIdAndIsActiveTrueOrderByCreatedAtDesc(String userId);

    // Tìm ví theo ID và UserID (Quan trọng để check quyền sở hữu)
    Optional<Wallet> findByIdAndUserId(String id, String userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select w from Wallet w where w.id = :id")
    Optional<Wallet> findByIdForUpdate(@Param("id") String id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select w from Wallet w where w.id = :id and w.userId = :userId")
    Optional<Wallet> findByIdAndUserIdForUpdate(@Param("id") String id, @Param("userId") String userId);

    boolean existsByNameIgnoreCaseAndUserIdAndIdNotAndIsActive(String name, String userId, String id, boolean isActive);

    void deleteByUserId(String userId);

    List<Wallet> findByUserId(String userId);
}
