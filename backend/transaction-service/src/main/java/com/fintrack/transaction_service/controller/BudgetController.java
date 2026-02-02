package com.fintrack.transaction_service.controller;

import com.fintrack.transaction_service.dto.request.BudgetCreationRequest;
import com.fintrack.transaction_service.dto.response.ApiResponse;
import com.fintrack.transaction_service.dto.response.BudgetResponse;
import com.fintrack.transaction_service.service.BudgetService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/budgets")
@RequiredArgsConstructor
public class BudgetController {
    private final BudgetService budgetService;

    @PostMapping
    public ApiResponse<BudgetResponse> create(@RequestBody BudgetCreationRequest request) {
        return ApiResponse.<BudgetResponse>builder()
                .result(budgetService.create(request))
                .build();
    }

    @GetMapping
    public ApiResponse<List<BudgetResponse>> getBudgets(
            @RequestParam String walletId,
            @RequestParam int month,
            @RequestParam int year
    ) {
        return ApiResponse.<List<BudgetResponse>>builder()
                .result(budgetService.getBudgets(walletId, month, year))
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<String> delete(@PathVariable String id) {
        budgetService.delete(id);
        return ApiResponse.<String>builder().result("Đã xóa ngân sách").build();
    }
}