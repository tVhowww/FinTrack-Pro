package com.fintrack.notification_service.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fintrack.notification_service.dto.event.NotificationEvent;
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
    private final ObjectMapper objectMapper; // Spring tự có sẵn, không cần config thêm

    @KafkaListener(topics = "notification-delivery", groupId = "notification-group")
    public void listenNotificationDelivery(String message) { // <--- Nhận String
        log.info("📩 Message received: {}", message);

        try {
            // 1. Biến String thành Object
            NotificationEvent event = objectMapper.readValue(message, NotificationEvent.class);

            // 2. Gửi Email
            emailService.sendEmail(EmailRequest.builder()
                    .to(new EmailRequest.To(event.getRecipient(), "User"))
                    .subject(event.getSubject())
                    .htmlContent(event.getBody())
                    .build());

        } catch (Exception e) {
            log.error("❌ Error processing message: {}", e.getMessage());
        }
    }
}