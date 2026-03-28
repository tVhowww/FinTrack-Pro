package com.fintrack.transaction_service.repository.specification;

import com.fintrack.transaction_service.entity.Transaction;
import com.fintrack.transaction_service.enums.TransactionType;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.util.List;

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
                return criteriaBuilder.between(root.get("date"), startDate, endDate);
            }
            if (startDate != null) {
                return criteriaBuilder.greaterThanOrEqualTo(root.get("date"), startDate);
            }
            return criteriaBuilder.lessThanOrEqualTo(root.get("date"), endDate);
        };
    }


    public static Specification<Transaction> hasCategoryIn(List<String> categoryIds) {
        return (root, query, criteriaBuilder) -> {
            if (categoryIds == null || categoryIds.isEmpty()) return null;
            // Dùng IN thay vì EQUAL
            return root.get("category").get("id").in(categoryIds);
        };
    }

    public static Specification<Transaction> hasWalletIdIn(List<String> walletIds) {
        return (root, query, criteriaBuilder) -> {
            if (walletIds == null || walletIds.isEmpty()) {
                return null;
            }
            return root.get("walletId").in(walletIds);
        };
    }

    public static Specification<Transaction> hasKeyword(String keyword) {
        return (root, query, criteriaBuilder) -> {
            if (keyword == null || keyword.trim().isEmpty()) {
                return null;
            }
            // Ép cả dữ liệu DB và từ khóa về chữ thường (lower) rồi dùng toán tử LIKE (%keyword%)
            return criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("note")),
                    "%" + keyword.toLowerCase() + "%"
            );
        };
    }

    public static Specification<Transaction> isNotTransfer() {
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.isNull(root.get("sagaId"));
    }
}