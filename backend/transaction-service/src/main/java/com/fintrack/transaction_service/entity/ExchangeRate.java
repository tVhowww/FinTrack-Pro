package com.fintrack.transaction_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "exchange_rates")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExchangeRate {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    // Đồng tiền gốc (Ví dụ: "USD")
    @Column(name = "base_currency", nullable = false)
    private String baseCurrency;

    // Đồng tiền đích (Ví dụ: "VND")
    @Column(name = "target_currency", nullable = false)
    private String targetCurrency;

    // Tỷ giá quy đổi (Ví dụ: 25400.50).
    // Dùng precision = 19, scale = 6 để lưu số thập phân thật chính xác cho tiền tệ
    @Column(nullable = false, precision = 19, scale = 6)
    private BigDecimal rate;

    // Thời gian cập nhật gần nhất
    @Column(name = "last_updated", nullable = false)
    private Instant lastUpdated;
}