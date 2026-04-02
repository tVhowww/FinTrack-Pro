package com.fintrack.transaction_service.service.budget;

import com.fintrack.transaction_service.dto.event.NotificationEvent;
import com.fintrack.transaction_service.dto.response.BudgetResponse;
import com.fintrack.transaction_service.entity.Transaction;
import com.fintrack.transaction_service.enums.TransactionType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.text.NumberFormat;
import java.time.ZoneId;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
@Slf4j
public class BudgetAlertEngine {

    private final BudgetService budgetService;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final StringRedisTemplate redisTemplate;

    /**
     * Hàm này được gọi ngay sau khi Transaction lưu thành công
     */
    public void checkAndAlert(Transaction tx, String recipientEmail, String username) {
        // Chỉ quan tâm các khoản Chi Tiêu
        if (tx.getType() != TransactionType.EXPENSE) return;

        try {
            int month = tx.getDate().atZone(ZoneId.systemDefault()).getMonthValue();
            int year = tx.getDate().atZone(ZoneId.systemDefault()).getYear();

            // 1. Lấy danh sách ngân sách bị ảnh hưởng (Hàm này tự động tính % rất xịn)
            List<BudgetResponse> budgets = budgetService.getBudgets(tx.getWalletId(), month, year, null);

            // 2. Lọc ra đúng Ngân sách khớp với Danh mục của giao dịch này
            for (BudgetResponse budget : budgets) {
                if (budget.getCategoryId().equals(tx.getCategory().getId())) {
                    evaluateThresholdAndNotify(budget, recipientEmail, username);
                }
            }
        } catch (Exception e) {
            log.error("Lỗi khi chạy Budget Alert Engine cho giao dịch {}: {}", tx.getId(), e.getMessage());
        }
    }

    private void evaluateThresholdAndNotify(BudgetResponse budget, String email, String username) {
        if (email == null || email.isEmpty()) return;

        double percentage = budget.getPercentage();
        String budgetId = budget.getId();

        // Key lưu trạng thái để chống spam (1 tháng chỉ báo 1 lần cho mỗi mốc)
        String alert80Key = "budget_alert:" + budgetId + ":80";
        String alert100Key = "budget_alert:" + budgetId + ":100";

        if (percentage >= 100) {
            // Nếu chưa từng báo 100% trong tháng này
            if (Boolean.FALSE.equals(redisTemplate.hasKey(alert100Key))) {
                sendEmailAlert(budget, "100%", "🔴 ĐÃ VƯỢT", email, username);
                redisTemplate.opsForValue().set(alert100Key, "true", 30, TimeUnit.DAYS);
                // Nếu vượt 100% thì đánh dấu luôn 80% để khỏi báo ngược lại
                redisTemplate.opsForValue().set(alert80Key, "true", 30, TimeUnit.DAYS);
            }
        } else if (percentage >= 80) {
            // Nếu chưa từng báo 80%
            if (Boolean.FALSE.equals(redisTemplate.hasKey(alert80Key))) {
                sendEmailAlert(budget, "80%", "🟡 SẮP VƯỢT", email, username);
                redisTemplate.opsForValue().set(alert80Key, "true", 30, TimeUnit.DAYS);
            }
        }
    }

    private void sendEmailAlert(BudgetResponse budget, String thresholdStr, String status, String email, String username) {
        NumberFormat formatter = NumberFormat.getInstance(Locale.US);
        String limit = formatter.format(budget.getAmount());
        String spent = formatter.format(budget.getSpentAmount());

        // Nội dung dùng \n, Notification Service của bác sẽ tự map nó thành <br> HTML
        String emailBody = String.format(
                "Xin chào %s,\n\n" +
                        "Hệ thống FinTrack thông báo: Ngân sách <b>%s</b> của bạn trong tháng %d/%d <b>%s HẠN MỨC (%s)</b>.\n\n" +
                        "• Hạn mức: %s\n" +
                        "• Đã chi tiêu: %s\n" +
                        "• Trạng thái hiện tại: %.1f%%\n\n" +
                        "Hãy cân đối lại chi tiêu trong tháng nhé!\n\n" +
                        "Trân trọng,\nĐội ngũ FinTrack",
                username,
                budget.getName(), budget.getMonth(), budget.getYear(), status, thresholdStr,
                limit, spent, budget.getPercentage()
        );

        NotificationEvent event = NotificationEvent.builder()
                .channel("EMAIL")
                .recipient(email)
                .subject("Cảnh báo Ngân sách: " + budget.getName())
                .body(emailBody)
                .build();

        kafkaTemplate.send("notification-delivery", event);
        log.info("Đã gửi cảnh báo ngân sách {} mức {} tới Kafka cho email {}", budget.getName(), thresholdStr, email);
    }
}