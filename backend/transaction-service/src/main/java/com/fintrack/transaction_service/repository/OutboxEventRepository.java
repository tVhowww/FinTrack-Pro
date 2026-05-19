package com.fintrack.transaction_service.repository;

import com.fintrack.transaction_service.entity.OutboxEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface OutboxEventRepository extends JpaRepository<OutboxEvent, String> {

    List<OutboxEvent> findByStatusOrderByCreatedAtAsc(String status);

    /**
     * Lấy các event PENDING có thể retry:
     * - nextRetryAt IS NULL (lần đầu, chưa bao giờ thất bại), HOẶC
     * - nextRetryAt <= now (đã đến hạn retry)
     * Sắp xếp theo createdAt để xử lý event cũ nhất trước.
     */
    @Query("""
            SELECT e FROM OutboxEvent e
            WHERE e.status = :status
              AND (e.nextRetryAt IS NULL OR e.nextRetryAt <= :now)
            ORDER BY e.createdAt ASC
            """)
    List<OutboxEvent> findRetryableEvents(@Param("status") String status,
                                          @Param("now") Instant now);
}
