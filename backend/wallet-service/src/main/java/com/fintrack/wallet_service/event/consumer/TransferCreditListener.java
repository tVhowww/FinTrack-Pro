package com.fintrack.wallet_service.event.consumer;

import com.fintrack.wallet_service.dto.event.TransferDebitEvent;
import com.fintrack.wallet_service.dto.event.TransferResultEvent;
import com.fintrack.wallet_service.dto.request.WalletBalanceUpdateRequest;
import com.fintrack.wallet_service.service.WalletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import com.fintrack.wallet_service.entity.InboxEvent;
import com.fintrack.wallet_service.repository.InboxEventRepository;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class TransferCreditListener {

    private final WalletService walletService;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final InboxEventRepository inboxEventRepository;

    @KafkaListener(topics = "transfer.debit-completed", groupId = "wallet-saga-group")
    @Transactional
    public void handleDebitCompleted(TransferDebitEvent event) {
        String processedKey = "saga:processed:wallet-credit:" + event.getSagaId();
        if (inboxEventRepository.existsById(processedKey)) {
            log.warn("Duplicate transfer debit event ignored for saga {}", event.getSagaId());
            return;
        }
        
        inboxEventRepository.save(InboxEvent.builder().id(processedKey).build());

        TransferResultEvent resultEvent = TransferResultEvent.builder()
                .sagaId(event.getSagaId())
                .build();

        try {
            // 1. Thực hiện cộng tiền vào ví đích
            WalletBalanceUpdateRequest request = WalletBalanceUpdateRequest.builder()
                    .amount(event.getAmount())
                    .idempotencyKey("transfer:" + event.getSagaId() + ":credit")
                    .build();
            walletService.updateBalance(event.getToWalletId(), request);

            // 2. Nếu thành công -> Bắn event báo cáo Thành Công
            resultEvent.setSuccess(true);
            kafkaTemplate.send("transfer.credit-completed", resultEvent);

        } catch (Exception e) {
            // 3. Nếu thất bại (ví dụ: ví đích bị xóa, lỗi database...) -> Bắn event báo cáo Thất Bại
            resultEvent.setSuccess(false);
            resultEvent.setReason(e.getMessage());
            kafkaTemplate.send("transfer.credit-failed", resultEvent);
        }
    }
}
