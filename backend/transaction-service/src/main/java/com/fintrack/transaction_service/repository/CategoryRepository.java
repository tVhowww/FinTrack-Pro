package com.fintrack.transaction_service.repository;

import com.fintrack.transaction_service.entity.Category;
import com.fintrack.transaction_service.enums.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, String> {
    // 1. Lấy tất cả danh mục gốc (Cha = null)
    List<Category> findByParentIsNull();

    // 2. Lấy danh mục gốc theo Loại (VD: Chỉ lấy gốc của EXPENSE)
    List<Category> findByTypeAndParentIsNull(TransactionType type);
}
