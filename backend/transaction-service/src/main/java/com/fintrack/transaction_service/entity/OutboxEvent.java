package com.fintrack.transaction_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "outbox_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OutboxEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String eventType; // e.g., WALLET_UPDATE, KAFKA_PUBLISH

    @Column(nullable = false, columnDefinition = "TEXT")
    private String payload; // JSON payload

    @Column(nullable = false)
    private String status; // PENDING, COMPLETED, FAILED

    @Column(nullable = false)
    private String topic; // Feign client name OR Kafka topic

    @Column(nullable = false)
    @Builder.Default
    private int retryCount = 0; // Số lần đã thử lại

    @CreationTimestamp
    private Instant createdAt;

    private Instant processedAt;

    private String errorMessage;

    private Instant nextRetryAt; // Thời điểm cho phép retry tiếp theo
}
