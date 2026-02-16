package com.fintrack.wallet_service.event.consumer;

import com.fintrack.wallet_service.dto.event.UserDeletedEvent;
import com.fintrack.wallet_service.dto.event.WalletsDeletedEvent;
import com.fintrack.wallet_service.entity.Wallet;
import com.fintrack.wallet_service.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserDeletedListener {

    private final WalletRepository walletRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @KafkaListener(topics = "user-deleted-topic", groupId = "wallet-service-group")
    @Transactional
    public void handleUserDeletedEvent(UserDeletedEvent event) {
        log.info("Wallet Service nhận yêu cầu dọn dẹp cho userId: {}", event.getUserId());

        // 1. Tìm tất cả các ví của User này TRƯỚC KHI xóa
        List<String> walletIds = walletRepository.findByUserId(event.getUserId())
                .stream()
                .map(Wallet::getId)
                .toList();

        if (!walletIds.isEmpty()) {
            // 2. Xóa tất cả ví trong DB (Hard delete)
            walletRepository.deleteByUserId(event.getUserId());
            log.info("Đã xóa {} ví của userId: {}", walletIds.size(), event.getUserId());

            // 3. Bắn event báo cho Transaction Service biết để xóa tiếp giao dịch
            WalletsDeletedEvent walletsDeletedEvent = new WalletsDeletedEvent(walletIds);
            kafkaTemplate.send("wallets-deleted-topic", walletsDeletedEvent);
            log.info("Đã gửi event wallets-deleted-topic với {} walletIds", walletIds.size());
        } else {
            log.info("User {} không có ví nào để xóa.", event.getUserId());
        }
    }
}