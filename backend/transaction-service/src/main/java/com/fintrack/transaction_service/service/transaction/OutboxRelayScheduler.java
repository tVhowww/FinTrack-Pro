package com.fintrack.transaction_service.service.transaction;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fintrack.transaction_service.dto.event.TransferDebitEvent;
import com.fintrack.transaction_service.dto.request.OutboxWalletUpdatePayload;
import com.fintrack.transaction_service.entity.OutboxEvent;
import com.fintrack.transaction_service.repository.OutboxEventRepository;
import com.fintrack.transaction_service.repository.httpclient.WalletClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class OutboxRelayScheduler {

    // Sau MAX_RETRIES lần thất bại liên tiếp → chuyển sang FAILED (dead letter)
    private static final int MAX_RETRIES = 5;

    private final OutboxEventRepository outboxEventRepository;
    private final WalletClient walletClient;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final ObjectMapper objectMapper;

    @Scheduled(fixedDelay = 5000)
    @Transactional
    public void processOutboxEvents() {
        // Lấy các event PENDING mà đã đến thời điểm được phép retry
        Instant now = Instant.now();
        List<OutboxEvent> pendingEvents = outboxEventRepository
                .findRetryableEvents("PENDING", now);

        if (pendingEvents.isEmpty()) return;

        log.info("Processing {} retryable outbox events", pendingEvents.size());

        for (OutboxEvent event : pendingEvents) {
            try {
                dispatch(event);

                event.setStatus("COMPLETED");
                event.setProcessedAt(now);
                event.setErrorMessage(null);
                outboxEventRepository.save(event);

                log.info("Outbox event {} processed successfully (retries={})",
                        event.getId(), event.getRetryCount());

            } catch (Exception e) {
                int newRetryCount = event.getRetryCount() + 1;
                event.setRetryCount(newRetryCount);
                event.setErrorMessage(e.getMessage());

                if (newRetryCount >= MAX_RETRIES) {
                    // Dead letter: dừng retry, đánh dấu FAILED để DBA xem xét thủ công
                    event.setStatus("FAILED");
                    log.error("Outbox event {} moved to DEAD LETTER after {} retries. Error: {}",
                            event.getId(), newRetryCount, e.getMessage());
                } else {
                    // Vẫn giữ PENDING nhưng delay theo exponential backoff
                    // Retry 1 → +10s, retry 2 → +30s, retry 3 → +90s, retry 4 → +270s
                    long delaySeconds = (long) (10 * Math.pow(3, newRetryCount - 1));
                    event.setNextRetryAt(now.plusSeconds(delaySeconds));
                    log.warn("Outbox event {} failed (attempt {}/{}), next retry in {}s. Error: {}",
                            event.getId(), newRetryCount, MAX_RETRIES, delaySeconds, e.getMessage());
                }

                outboxEventRepository.save(event);
            }
        }
    }

    private void dispatch(OutboxEvent event) throws Exception {
        if ("WALLET_UPDATE".equals(event.getEventType())) {
            OutboxWalletUpdatePayload payload = objectMapper.readValue(
                    event.getPayload(), OutboxWalletUpdatePayload.class);
            walletClient.updateBalance(payload.getWalletId(), payload.getRequest());

        } else if ("KAFKA_PUBLISH".equals(event.getEventType())) {
            TransferDebitEvent payload = objectMapper.readValue(
                    event.getPayload(), TransferDebitEvent.class);
            kafkaTemplate.send(event.getTopic(), payload);

        } else {
            log.warn("Unknown event type '{}' for outbox event {}, skipping.",
                    event.getEventType(), event.getId());
        }
    }
}
