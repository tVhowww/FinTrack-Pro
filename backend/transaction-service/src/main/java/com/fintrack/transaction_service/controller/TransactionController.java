package com.fintrack.transaction_service.controller;

import com.fintrack.transaction_service.dto.request.TransactionCreationRequest;
import com.fintrack.transaction_service.dto.response.ApiResponse;
import com.fintrack.transaction_service.dto.response.MonthlyStatisticsResponse;
import com.fintrack.transaction_service.dto.response.PageResponse;
import com.fintrack.transaction_service.dto.response.TransactionResponse;
import com.fintrack.transaction_service.enums.TransactionType;
import com.fintrack.transaction_service.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequiredArgsConstructor
@RequestMapping("transactions")
public class TransactionController {
    private final TransactionService transactionService;

    @GetMapping("/export")
    public ResponseEntity<Resource> exportTransactions(
            @RequestParam(required = false) String walletId,
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) Instant startDate,
            @RequestParam(required = false) Instant endDate
    ) {
        String filename = "transactions_export.xlsx";
        InputStreamResource file = new InputStreamResource(transactionService.exportToExcel(walletId, type, startDate, endDate));

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(file);
    }

    @GetMapping("/statistics/monthly")
    public ApiResponse<MonthlyStatisticsResponse> getMonthlyStatistics(
            @RequestParam String walletId,
            @RequestParam int month,
            @RequestParam int year
    ) {
        var result = transactionService.getMonthlyStatistics(walletId, month, year);

        return ApiResponse.<MonthlyStatisticsResponse>builder()
                .result(result)
                .build();
    }

    @GetMapping
    public ApiResponse<PageResponse<TransactionResponse>> getTransactions(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "walletId", required = false) String walletId,
            @RequestParam(value = "type", required = false) TransactionType type,
            @RequestParam(value = "startDate", required = false) Instant startDate,
            @RequestParam(value = "endDate", required = false) Instant endDate,
            @RequestParam(value = "categoryId", required = false) String categoryId
    ) {
        var result = transactionService.getTransactions(page, size, walletId, type, startDate, endDate, categoryId);

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
