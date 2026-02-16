package com.fintrack.notification_service.controller;

import com.fintrack.notification_service.dto.event.NotificationEvent;
import com.fintrack.notification_service.dto.event.UserDeletedEvent;
import com.fintrack.notification_service.dto.request.EmailRequest;
import com.fintrack.notification_service.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
public class NotificationConsumer {

    private final EmailService emailService;

    // Đã đổi tham số từ String -> NotificationEvent
    @KafkaListener(topics = "notification-delivery", groupId = "notification-group-v3")
    public void listenNotificationDelivery(NotificationEvent event) {
        log.info("📩 Nhận được message từ Kafka cho email: {}", event.getRecipient());

        try {
            emailService.sendEmail(EmailRequest.builder()
                    .to(new EmailRequest.To(event.getRecipient(), "User"))
                    .subject(event.getSubject())
                    .htmlContent(event.getBody())
                    .build());
            log.info("✉️ Đã gửi email thành công tới: {}", event.getRecipient());
        } catch (Exception e) {
            log.error("❌ Lỗi khi gửi email notification: {}", e.getMessage(), e);
        }
    }

    // Đã đổi tham số từ String -> UserDeletedEvent
    @KafkaListener(topics = "user-deleted-topic", groupId = "notification-group-v3")
    public void sendFarewellEmail(UserDeletedEvent event) {
        try {
            String emailTo = event.getEmail();
            String subject = "Tạm biệt bạn từ FinTrack";
            String body = "Rất tiếc khi thấy bạn rời đi. Dữ liệu của bạn đã được xóa khỏi hệ thống của chúng tôi. Hy vọng được gặp lại bạn vào một ngày không xa!";

            emailService.sendEmail(EmailRequest.builder()
                    .to(new EmailRequest.To(emailTo, "User"))
                    .subject(subject)
                    .htmlContent(body)
                    .build());
            log.info("Đã gửi email chia tay tới: {}", emailTo);
        } catch (Exception e) {
            log.error("Lỗi khi gửi email farewell: {}", e.getMessage(), e);
        }
    }
}