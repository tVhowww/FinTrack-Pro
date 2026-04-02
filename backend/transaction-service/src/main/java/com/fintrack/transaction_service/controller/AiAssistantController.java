package com.fintrack.transaction_service.controller;

import com.fintrack.transaction_service.dto.response.AiReceiptResponse;
import com.fintrack.transaction_service.dto.response.ApiResponse;
import com.fintrack.transaction_service.service.ai.AiAdvisorService;
import com.fintrack.transaction_service.service.ai.AiAssistantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
public class AiAssistantController {

    private final AiAssistantService aiAssistantService;
    private final AiAdvisorService aiAdvisorService;

    @PostMapping(value = "/scan-receipt", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<AiReceiptResponse> scanReceipt(
            @RequestPart(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "text", required = false) String text
    ) {
        return ApiResponse.<AiReceiptResponse>builder()
                .result(aiAssistantService.scanReceipt(file, text))
                .build();
    }

    @PostMapping("/chat")
    public ApiResponse<String> chatWithAdvisor(@RequestBody Map<String, String> request) {
        String userMessage = request.getOrDefault("message", "Nhận xét tình hình tài chính của tôi tháng này.");

        return ApiResponse.<String>builder()
                .result(aiAdvisorService.chatWithAdvisor(userMessage))
                .build();
    }
}