package com.fintrack.transaction_service.controller;

import com.fintrack.transaction_service.dto.request.TransactionCreationRequest;
import com.fintrack.transaction_service.dto.response.ApiResponse;
import com.fintrack.transaction_service.dto.response.PageResponse;
import com.fintrack.transaction_service.dto.response.TransactionResponse;
import com.fintrack.transaction_service.enums.TransactionType;
import com.fintrack.transaction_service.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequiredArgsConstructor
@RequestMapping("transactions")
public class TransactionController {
    private final TransactionService transactionService;

    @GetMapping
    public ApiResponse<PageResponse<TransactionResponse>> getTransactions(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "walletId", required = false) String walletId,
            @RequestParam(value = "type", required = false) TransactionType type,
            @RequestParam(value = "startDate", required = false) Instant startDate,
            @RequestParam(value = "endDate", required = false) Instant endDate
    ) {
        var result = transactionService.getTransactions(page, size, walletId, type, startDate, endDate);

        return ApiResponse.<PageResponse<TransactionResponse>>builder()
                .result(result)
                .build();
    }

    @PostMapping
    ApiResponse<TransactionResponse> createTransaction(@RequestBody TransactionCreationRequest request) {
        return ApiResponse.<TransactionResponse>builder()
                .result(transactionService.create(request))
                .build();
    }
}
