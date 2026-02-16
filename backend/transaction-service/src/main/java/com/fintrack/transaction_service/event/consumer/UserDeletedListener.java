package com.fintrack.transaction_service.event.consumer;

import com.fintrack.transaction_service.dto.event.UserDeletedEvent;
import com.fintrack.transaction_service.dto.event.WalletsDeletedEvent;
import com.fintrack.transaction_service.repository.BudgetRepository;
import com.fintrack.transaction_service.repository.CategoryRepository;
import com.fintrack.transaction_service.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserDeletedListener {

    private final BudgetRepository budgetRepository;
    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;

    @KafkaListener(topics = "user-deleted-topic", groupId = "transaction-service-group")
    @Transactional
    public void handleUserDeletedEvent(UserDeletedEvent event) {
        log.info("Nhận được yêu cầu xóa dữ liệu cho userId: {}", event.getUserId());

        try {
            // 1. Xóa tất cả Ngân sách (Budget) của User này
            budgetRepository.deleteByUserId(event.getUserId());

            // 2. Xóa tất cả Danh mục (Category) tự tạo của User này
            categoryRepository.deleteByUserId(event.getUserId());

            log.info("Đã dọn dẹp xong dữ liệu giao dịch/ngân sách cho userId: {}", event.getUserId());
        } catch (Exception e) {
            log.error("Lỗi khi dọn dẹp dữ liệu cho userId {}: {}", event.getUserId(), e.getMessage());
        }
    }

    @KafkaListener(topics = "wallets-deleted-topic", groupId = "transaction-service-group")
    @Transactional
    public void handleWalletsDeletedEvent(WalletsDeletedEvent event) {
        log.info("Nhận được yêu cầu xóa giao dịch cho {} ví bị xóa", event.getWalletIds().size());

        try {
            if (event.getWalletIds() != null && !event.getWalletIds().isEmpty()) {
                transactionRepository.deleteByWalletIdIn(event.getWalletIds());
                log.info("Đã dọn dẹp xong toàn bộ giao dịch của các ví này.");
            }
        } catch (Exception e) {
            log.error("Lỗi khi xóa giao dịch theo list walletIds: {}", e.getMessage());
        }
    }
}