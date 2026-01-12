package com.fintrack.notification_service.service;

import com.fintrack.notification_service.dto.request.EmailRequest;
import com.fintrack.notification_service.exception.AppException;
import com.fintrack.notification_service.exception.ErrorCode;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {
    private final JavaMailSender javaMailSender;

    @Async
    public void sendEmail(EmailRequest request) {
        // Tạo MimeMessage thay vì SimpleMailMessage để hỗ trợ HTML và đính kèm
        MimeMessage mimeMessage = javaMailSender.createMimeMessage();

        try {
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED, StandardCharsets.UTF_8.name());

            helper.setTo(request.getTo().getEmail());
            helper.setSubject(request.getSubject());
            helper.setText(request.getHtmlContent(), true); // true = bật chế độ HTML

            javaMailSender.send(mimeMessage);
            log.info("Email sent successfully to: {}", request.getTo().getEmail());

        } catch (MessagingException e) {
            log.error("Failed to send email", e);
            throw new AppException(ErrorCode.CANNOT_SEND_EMAIL);
        }
    }
}
