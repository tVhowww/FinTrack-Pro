package com.fintrack.notification_service.controller;

import com.fintrack.notification_service.dto.request.EmailRequest;
import com.fintrack.notification_service.dto.response.ApiResponse;
import com.fintrack.notification_service.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class NotificationController {
    private final EmailService emailService;

    @PostMapping("/email/send")
    public ApiResponse<String> sendEmail(@RequestBody EmailRequest request) {
        emailService.sendEmail(request);
        return ApiResponse.<String>builder()
                .result("Email has been sent (Async)")
                .build();
    }
}