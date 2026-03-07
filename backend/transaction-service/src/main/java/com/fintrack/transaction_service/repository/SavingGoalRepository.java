package com.fintrack.transaction_service.repository;

import com.fintrack.transaction_service.entity.SavingGoal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavingGoalRepository extends JpaRepository<SavingGoal, String> {

    // Lấy toàn bộ mục tiêu của 1 User
    List<SavingGoal> findAllByUserIdOrderByCreatedAtDesc(String userId);

    // Tìm 1 mục tiêu cụ thể của 1 User (để bảo mật, tránh user này sửa goal user khác)
    Optional<SavingGoal> findByIdAndUserId(String id, String userId);
}