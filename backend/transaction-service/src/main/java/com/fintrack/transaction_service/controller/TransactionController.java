package com.fintrack.transaction_service.controller;

import com.fintrack.transaction_service.dto.request.TransactionCreationRequest;
import com.fintrack.transaction_service.dto.request.TransactionUpdateRequest;
import com.fintrack.transaction_service.dto.response.*;
import com.fintrack.transaction_service.enums.TransactionType;
import com.fintrack.transaction_service.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("transactions")
public class TransactionController {
    private final TransactionService transactionService;

    @GetMapping("/statistics/total-balance")
    public ApiResponse<BigDecimal> getTotalBalance() {
        return ApiResponse.<BigDecimal>builder()
                .result(transactionService.getTotalBalance())
                .build();
    }

    @GetMapping("/statistics/highest-expenses")
    public ApiResponse<List<TransactionResponse>> getHighestExpenses(
            @RequestParam(required = false) String walletId,
            @RequestParam int month,
            @RequestParam int year
    ) {
        return ApiResponse.<List<TransactionResponse>>builder()
                .result(transactionService.getHighestExpenses(walletId, month, year))
                .build();
    }

    // Biểu đồ cột (Trend)
    @GetMapping("/statistics/trend")
    public ApiResponse<List<BalanceTrendResponse>> getBalanceTrend(
            @RequestParam(required = false) String walletId // Cho phép null để xem Global
    ) {
        return ApiResponse.<List<BalanceTrendResponse>>builder()
                .result(transactionService.getBalanceTrend(walletId))
                .build();
    }

    // Biểu đồ tròn (Cơ cấu)
    @GetMapping("/statistics/structure")
    public ApiResponse<List<ExpenseStructureResponse>> getExpenseStructure(
            @RequestParam(required = false) String walletId, // Cho phép null
            @RequestParam int month,
            @RequestParam int year
    ) {
        return ApiResponse.<List<ExpenseStructureResponse>>builder()
                .result(transactionService.getExpenseStructure(walletId, month, year))
                .build();
    }

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
            @RequestParam(required = false) String walletId,
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

    @GetMapping("/{id}")
    public ApiResponse<TransactionResponse> getTransaction(@PathVariable String id) {
        return ApiResponse.<TransactionResponse>builder()
                .result(transactionService.getTransaction(id))
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<TransactionResponse> updateTransaction(@PathVariable String id, @RequestBody TransactionUpdateRequest request) {
        return ApiResponse.<TransactionResponse>builder()
                .result(transactionService.update(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteTransaction(@PathVariable String id) {
        transactionService.delete(id);
        return ApiResponse.<String>builder()
                .result("Giao dịch đã được xóa thành công")
                .build();
    }
}
