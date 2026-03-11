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
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {
    private final JavaMailSender javaMailSender;

    private final TemplateEngine templateEngine;

    @Async
    public void sendEmail(EmailRequest request) {
        MimeMessage mimeMessage = javaMailSender.createMimeMessage();

        try {
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED, StandardCharsets.UTF_8.name());

            // 1. Dữ liệu từ Kafka gửi sang đang dùng "\n" để xuống dòng.
            // Trong HTML "\n" vô tác dụng, nên mình phải đổi nó thành thẻ "<br>"
            String htmlFormattedBody = request.getHtmlContent().replace("\n", "<br>");

            // 2. Nhét dữ liệu vào biến "bodyContent" của file HTML
            Context context = new Context();
            context.setVariable("bodyContent", htmlFormattedBody);

            // 3. Render file "default-email.html" thành 1 cục String HTML hoàn chỉnh
            String finalHtml = templateEngine.process("default-email", context);

            // 4. Gửi email với nội dung HTML đã render
            helper.setTo(request.getTo().getEmail());
            helper.setSubject(request.getSubject());
            helper.setText(finalHtml, true); // true = bật chế độ HTML

            javaMailSender.send(mimeMessage);
            log.info("Email HTML đã gửi thành công tới: {}", request.getTo().getEmail());

        } catch (MessagingException e) {
            log.error("Failed to send email", e);
            throw new AppException(ErrorCode.CANNOT_SEND_EMAIL);
        }
    }
}