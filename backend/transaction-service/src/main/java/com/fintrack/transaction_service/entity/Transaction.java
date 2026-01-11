package com.fintrack.transaction_service.entity;

import com.fintrack.transaction_service.enums.TransactionType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class) // Tự động cập nhật ngày tạo/sửa
public class Transaction {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType type;

    @Column(name = "wallet_id", nullable = false)
    private String walletId;

    @ManyToOne(fetch = FetchType.LAZY) // Lazy để tối ưu hiệu năng
    @JoinColumn(name = "category_id") // Nó vẫn sẽ lưu vào cột 'category_id' trong DB
    private Category category;

    private String note;

    @Column(nullable = false)
    private Instant date;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant createdAt; // Ngày bản ghi được tạo trong DB

    @LastModifiedDate
    @Column(insertable = false)
    private Instant updatedAt; // Ngày sửa cuối cùng
}
