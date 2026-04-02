package com.fintrack.transaction_service.service;

import com.fintrack.transaction_service.dto.event.NotificationEvent;
import com.fintrack.transaction_service.entity.Category;
import com.fintrack.transaction_service.entity.Transaction;
import com.fintrack.transaction_service.enums.TransactionType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.text.NumberFormat;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionNotificationWorker {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Async
    public void sendTransactionNotification(Transaction transaction, Category category, String recipientEmail, String username, String currency) {
        try {
            if (recipientEmail == null || recipientEmail.isEmpty()) {
                log.warn("User không có email, bỏ qua gửi thông báo cho transaction: {}", transaction.getId());
                return;
            }

            NumberFormat formatter = NumberFormat.getInstance(Locale.US);
            String formattedNumber = formatter.format(transaction.getAmount().abs());
            String finalCurrency = (currency != null && !currency.isEmpty()) ? currency : "VND";
            String amountString;
            String actionString;

            if (transaction.getType() == TransactionType.EXPENSE) {
                amountString = "-" + formattedNumber + " " + finalCurrency;
                actionString = "thanh toán cho";
            } else {
                amountString = "+" + formattedNumber + " " + finalCurrency;
                actionString = "nhận tiền từ";
            }

            String categoryName = (category != null) ? category.getName() : "Không phân loại";

            String emailBody = String.format(
                    "Xin chào %s,\n\n" +
                            "Giao dịch mới: %s\n" +
                            "Nội dung: %s %s\n" +
                            "Ghi chú: %s\n" +
                            "Thời gian: %s\n\n" +
                            "Đây là email tự động, vui lòng không trả lời.",
                    username,
                    amountString,
                    actionString,
                    categoryName,
                    transaction.getNote() != null ? transaction.getNote() : "Không có",
                    transaction.getDate().toString()
            );

            NotificationEvent event = NotificationEvent.builder()
                    .channel("EMAIL")
                    .recipient(recipientEmail)
                    .subject("Biến động số dư: " + amountString)
                    .body(emailBody)
                    .build();

            kafkaTemplate.send("notification-delivery", event);
            log.info("Đã gửi notification event cho transaction: {}", transaction.getId());

        } catch (Exception e) {
            log.error("Lỗi khi gửi Kafka Notification cho transaction {}: {}", transaction.getId(), e.getMessage(), e);
        }
    }
}