package com.fintrack.transaction_service.repository.specification;

import com.fintrack.transaction_service.entity.Transaction;
import com.fintrack.transaction_service.enums.TransactionType;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;

public class TransactionSpecification {

    // Lọc theo Wallet ID
    public static Specification<Transaction> hasWalletId(String walletId) {
        return (root, query, criteriaBuilder) -> {
            if (walletId == null || walletId.isEmpty()) return null;
            return criteriaBuilder.equal(root.get("walletId"), walletId);
        };
    }

    // Lọc theo Loại (INCOME/EXPENSE)
    public static Specification<Transaction> hasType(TransactionType type) {
        return (root, query, criteriaBuilder) -> {
            if (type == null) return null;
            return criteriaBuilder.equal(root.get("type"), type);
        };
    }

    // Lọc theo khoảng ngày (Từ ngày... Đến ngày...)
    public static Specification<Transaction> createdBetween(Instant startDate, Instant endDate) {
        return (root, query, criteriaBuilder) -> {
            if (startDate == null && endDate == null) return null;
            if (startDate != null && endDate != null) {
                return criteriaBuilder.between(root.get("createdAt"), startDate, endDate);
            }
            if (startDate != null) {
                return criteriaBuilder.greaterThanOrEqualTo(root.get("createdAt"), startDate);
            }
            return criteriaBuilder.lessThanOrEqualTo(root.get("createdAt"), endDate);
        };
    }
}