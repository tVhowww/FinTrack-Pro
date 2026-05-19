package com.fintrack.transaction_service.service.transaction;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fintrack.transaction_service.entity.OutboxEvent;
import com.fintrack.transaction_service.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class OutboxService {
    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;

    @Transactional(propagation = Propagation.MANDATORY)
    public void saveEvent(String topic, String eventType, Object payload) {
        try {
            String jsonPayload = objectMapper.writeValueAsString(payload);
            OutboxEvent event = OutboxEvent.builder()
                    .topic(topic)
                    .eventType(eventType)
                    .payload(jsonPayload)
                    .status("PENDING")
                    .build();
            outboxEventRepository.save(event);
        } catch (Exception e) {
            log.error("Failed to serialize outbox event payload", e);
            throw new RuntimeException("Failed to save outbox event", e);
        }
    }
}
