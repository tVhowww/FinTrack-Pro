package com.fintrack.notification_service.service;

import com.fintrack.notification_service.dto.request.EmailRequest;
import com.fintrack.notification_service.exception.AppException;
import com.fintrack.notification_service.exception.ErrorCode;
import com.mailjet.client.ClientOptions;
import com.mailjet.client.MailjetClient;
import com.mailjet.client.MailjetRequest;
import com.mailjet.client.MailjetResponse;
import com.mailjet.client.resource.Emailv31;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final TemplateEngine templateEngine;

    // Lấy API Key từ biến môi trường trên Render
    @Value("${MAIL_USERNAME:mock_api_key}")
    private String apiKey;

    // Lấy Secret Key từ biến môi trường trên Render
    @Value("${MAIL_PASSWORD:mock_secret_key}")
    private String apiSecret;

    // Lấy email người gửi
    @Value("${MAIL_FROM:haun4700@gmail.com}") 
    private String senderEmail;

    @Async
    public void sendEmail(EmailRequest request) {
        try {
            // 1. Xử lý xuống dòng cho HTML
            String htmlFormattedBody = request.getHtmlContent().replace("\n", "<br>");

            // 2. Nhét dữ liệu vào biến "bodyContent" của file HTML
            Context context = new Context();
            context.setVariable("bodyContent", htmlFormattedBody);

            // 3. Render file "default-email.html" thành 1 cục String HTML hoàn chỉnh
            String finalHtml = templateEngine.process("default-email", context);

            // 4. Khởi tạo Mailjet Client kết nối qua đường HTTP (Port 443 - không bị chặn)
            MailjetClient client = new MailjetClient(
                    ClientOptions.builder()
                            .apiKey(apiKey)
                            .apiSecretKey(apiSecret)
                            .build()
            );

            // 5. Đóng gói dữ liệu gửi đi (Đã nhét finalHtml vào HTMLPART)
            MailjetRequest mailjetRequest = new MailjetRequest(Emailv31.resource)
                    .property(Emailv31.MESSAGES, new JSONArray()
                            .put(new JSONObject()
                                    .put(Emailv31.Message.FROM, new JSONObject()
                                            .put("Email", senderEmail)
                                            .put("Name", "FinTrack System"))
                                    .put(Emailv31.Message.TO, new JSONArray()
                                            .put(new JSONObject()
                                                    .put("Email", request.getTo().getEmail())))
                                    .put(Emailv31.Message.SUBJECT, request.getSubject())
                                    .put(Emailv31.Message.HTMLPART, finalHtml))); // Render xong đập vào đây

            // 6. Nhấn nút gửi!
            MailjetResponse response = client.post(mailjetRequest);

            if (response.getStatus() == 200) {
                log.info("Email HTML đã gửi thành công tới: {}", request.getTo().getEmail());
            } else {
                log.error("Mailjet API trả về lỗi: {}", response.getData());
                throw new AppException(ErrorCode.CANNOT_SEND_EMAIL);
            }

        } catch (Exception e) {
            log.error("Failed to send email via Mailjet API", e);
            throw new AppException(ErrorCode.CANNOT_SEND_EMAIL);
        }
    }
}