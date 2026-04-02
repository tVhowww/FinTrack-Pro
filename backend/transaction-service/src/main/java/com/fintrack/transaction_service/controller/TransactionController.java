package com.fintrack.transaction_service.controller;

import com.fintrack.transaction_service.dto.request.TransactionCreationRequest;
import com.fintrack.transaction_service.dto.request.TransactionUpdateRequest;
import com.fintrack.transaction_service.dto.request.TransferRequest;
import com.fintrack.transaction_service.dto.response.*;
import com.fintrack.transaction_service.enums.TransactionType;

// Import 4 Services mới đã chia nhỏ (SRP)
import com.fintrack.transaction_service.service.transaction.TransactionCommandService;
import com.fintrack.transaction_service.service.transaction.TransactionExportService;
import com.fintrack.transaction_service.service.transaction.TransactionQueryService;
import com.fintrack.transaction_service.service.transaction.TransactionStatisticsService;

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
@RequestMapping("/transactions")
public class TransactionController {

    private final TransactionCommandService commandService;
    private final TransactionQueryService queryService;
    private final TransactionStatisticsService statisticsService;
    private final TransactionExportService exportService;

    // =========================================================
    // 1. COMMAND ENDPOINTS (Thêm/Sửa/Xóa/Chuyển tiền)
    // =========================================================

    @PostMapping
    public ApiResponse<TransactionResponse> createTransaction(@RequestBody TransactionCreationRequest request) {
        return ApiResponse.<TransactionResponse>builder()
                .result(commandService.create(request))
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<TransactionResponse> updateTransaction(@PathVariable String id, @RequestBody TransactionUpdateRequest request) {
        return ApiResponse.<TransactionResponse>builder()
                .result(commandService.update(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteTransaction(@PathVariable String id) {
        commandService.delete(id);
        return ApiResponse.<String>builder()
                .result("Giao dịch đã được xóa thành công")
                .build();
    }

    @PostMapping("/transfer")
    public ApiResponse<TransactionResponse> transferMoney(@RequestBody TransferRequest request) {
        TransactionResponse response = commandService.transfer(request);
        return ApiResponse.<TransactionResponse>builder()
                .result(response)
                .message("Đã tiếp nhận yêu cầu chuyển tiền")
                .build();
    }

    // =========================================================
    // 2. QUERY ENDPOINTS (Lấy danh sách/Chi tiết)
    // =========================================================

    @GetMapping
    public ApiResponse<PageResponse<TransactionResponse>> getTransactions(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "walletId", required = false) String walletId,
            @RequestParam(value = "type", required = false) TransactionType type,
            @RequestParam(value = "startDate", required = false) Instant startDate,
            @RequestParam(value = "endDate", required = false) Instant endDate,
            @RequestParam(value = "categoryId", required = false) String categoryId,
            @RequestParam(value = "keyword", required = false) String keyword
    ) {
        var result = queryService.getTransactions(page, size, walletId, type, startDate, endDate, categoryId, keyword);
        return ApiResponse.<PageResponse<TransactionResponse>>builder()
                .result(result)
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<TransactionResponse> getTransaction(@PathVariable String id) {
        return ApiResponse.<TransactionResponse>builder()
                .result(queryService.getTransaction(id))
                .build();
    }

    // =========================================================
    // 3. STATISTICS ENDPOINTS (Thống kê/Biểu đồ)
    // =========================================================

    @GetMapping("/statistics/total-balance")
    public ApiResponse<BigDecimal> getTotalBalance() {
        return ApiResponse.<BigDecimal>builder()
                .result(statisticsService.getTotalBalance())
                .build();
    }

    @GetMapping("/statistics/highest-expenses")
    public ApiResponse<List<TransactionResponse>> getHighestExpenses(
            @RequestParam(required = false) String walletId,
            @RequestParam int month,
            @RequestParam int year
    ) {
        return ApiResponse.<List<TransactionResponse>>builder()
                .result(statisticsService.getHighestExpenses(walletId, month, year))
                .build();
    }

    @GetMapping("/statistics/trend")
    public ApiResponse<List<BalanceTrendResponse>> getBalanceTrend(
            @RequestParam(required = false) String walletId
    ) {
        return ApiResponse.<List<BalanceTrendResponse>>builder()
                .result(statisticsService.getBalanceTrend(walletId))
                .build();
    }

    @GetMapping("/statistics/structure")
    public ApiResponse<List<ExpenseStructureResponse>> getExpenseStructure(
            @RequestParam(required = false) String walletId,
            @RequestParam int month,
            @RequestParam int year
    ) {
        return ApiResponse.<List<ExpenseStructureResponse>>builder()
                .result(statisticsService.getExpenseStructure(walletId, month, year))
                .build();
    }

    @GetMapping("/statistics/monthly")
    public ApiResponse<MonthlyStatisticsResponse> getMonthlyStatistics(
            @RequestParam(required = false) String walletId,
            @RequestParam int month,
            @RequestParam int year
    ) {
        var result = statisticsService.getMonthlyStatistics(walletId, month, year);
        return ApiResponse.<MonthlyStatisticsResponse>builder()
                .result(result)
                .build();
    }

    // =========================================================
    // 4. EXPORT ENDPOINTS (Xuất file)
    // =========================================================

    @GetMapping("/export")
    public ResponseEntity<Resource> exportTransactions(
            @RequestParam(required = false) String walletId,
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) Instant startDate,
            @RequestParam(required = false) Instant endDate
    ) {
        String filename = "transactions_export.xlsx";
        InputStreamResource file = new InputStreamResource(exportService.exportToExcel(walletId, type, startDate, endDate));

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(file);
    }
}