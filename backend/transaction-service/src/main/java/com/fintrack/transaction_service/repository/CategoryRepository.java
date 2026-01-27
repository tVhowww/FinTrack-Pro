package com.fintrack.transaction_service.repository;

import com.fintrack.transaction_service.entity.Category;
import com.fintrack.transaction_service.enums.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, String> {

    // 1. Lấy danh mục (Gốc) của Hệ thống HOẶC của User hiện tại
    // Sử dụng @Query để fetch luôn subCategories (Giải quyết N+1)
    @Query("SELECT c FROM Category c LEFT JOIN FETCH c.subCategories " +
            "WHERE c.parent IS NULL " +
            "AND (c.userId IS NULL OR c.userId = :userId) " +
            "AND c.deleted = false")
    List<Category> findAllRootCategories(String userId);

    // 2. Lấy theo loại (có lọc user)
    @Query("SELECT c FROM Category c LEFT JOIN FETCH c.subCategories " +
            "WHERE c.parent IS NULL " +
            "AND c.type = :type " +
            "AND (c.userId IS NULL OR c.userId = :userId) " +
            "AND c.deleted = false")
    List<Category> findAllRootCategoriesByType(String userId, TransactionType type);

    // 3. Check trùng tên (Trong phạm vi User hoặc System)
    boolean existsByNameAndUserIdAndType(String name, String userId, TransactionType type);

    // Check trùng cho danh mục hệ thống (userId null)
    boolean existsByNameAndUserIdIsNullAndType(String name, TransactionType type);

    Optional<Category> findByNameAndTypeAndUserIdIsNull(String name, TransactionType type);
}
