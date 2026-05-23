package com.fintrack.notification_service.service;

import com.fintrack.notification_service.dto.request.EmailRequest;
import com.fintrack.notification_service.exception.AppException;
import com.fintrack.notification_service.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.ses.SesClient;
import software.amazon.awssdk.services.ses.model.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final TemplateEngine templateEngine;

    @Value("${AWS_ACCESS_KEY_ID:mock_access_key}")
    private String accessKey;

    @Value("${AWS_SECRET_ACCESS_KEY:mock_secret_key}")
    private String secretKey;

    @Value("${AWS_REGION:ap-southeast-1}")
    private String region;

    @Value("${MAIL_FROM:haun4700@gmail.com}")
    private String senderEmail;

    @Async
    public void sendEmail(EmailRequest request) {
        try {
            // 1. Render giao diện HTML từ Thymeleaf
            String htmlFormattedBody = request.getHtmlContent().replace("\n", "<br>");
            Context context = new Context();
            context.setVariable("bodyContent", htmlFormattedBody);
            String finalHtml = templateEngine.process("default-email", context);

            // 2. Khởi tạo AWS SES Client (Gọi qua HTTPS, lách luật Render)
            SesClient client = SesClient.builder()
                    .region(Region.of(region))
                    .credentialsProvider(StaticCredentialsProvider.create(
                            AwsBasicCredentials.create(accessKey, secretKey)
                    ))
                    .build();

            // 3. Đóng gói bức thư
            SendEmailRequest sendEmailRequest = SendEmailRequest.builder()
                    .source(senderEmail)
                    .destination(Destination.builder().toAddresses(request.getTo().getEmail()).build())
                    .message(Message.builder()
                            .subject(Content.builder().data(request.getSubject()).build())
                            .body(Body.builder()
                                    .html(Content.builder().data(finalHtml).build())
                                    .build())
                            .build())
                    .build();

            // 4. Khai hỏa
            client.sendEmail(sendEmailRequest);
            client.close();
            
            log.info("AWS SES đã giao thư thành công tới: {}", request.getTo().getEmail());

        } catch (SesException e) {
            log.error("Lỗi từ AWS SES: {}", e.awsErrorDetails().errorMessage());
            throw new AppException(ErrorCode.CANNOT_SEND_EMAIL);
        } catch (Exception e) {
            log.error("Lỗi hệ thống khi gửi email qua AWS", e);
            throw new AppException(ErrorCode.CANNOT_SEND_EMAIL);
        }
    }
}