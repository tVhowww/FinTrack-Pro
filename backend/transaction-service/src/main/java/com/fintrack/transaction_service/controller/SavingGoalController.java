package com.fintrack.transaction_service.controller;

import com.fintrack.transaction_service.dto.request.FundAddRequest;
import com.fintrack.transaction_service.dto.request.SavingGoalRequest;
import com.fintrack.transaction_service.dto.response.ApiResponse;
import com.fintrack.transaction_service.dto.response.SavingGoalResponse;
import com.fintrack.transaction_service.service.SavingGoalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/saving-goals")
@RequiredArgsConstructor
public class SavingGoalController {

    private final SavingGoalService savingGoalService;

    @GetMapping
    public ApiResponse<List<SavingGoalResponse>> getMyGoals() {
        return ApiResponse.<List<SavingGoalResponse>>builder()
                .result(savingGoalService.getMyGoals())
                .build();
    }

    @PostMapping
    public ApiResponse<SavingGoalResponse> createGoal(@RequestBody @Valid SavingGoalRequest request) {
        return ApiResponse.<SavingGoalResponse>builder()
                .result(savingGoalService.createGoal(request))
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<SavingGoalResponse> updateGoal(@PathVariable String id, @RequestBody @Valid SavingGoalRequest request) {
        return ApiResponse.<SavingGoalResponse>builder()
                .result(savingGoalService.updateGoal(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteGoal(@PathVariable String id) {
        savingGoalService.deleteGoal(id);
        return ApiResponse.<String>builder()
                .result("Đã xóa mục tiêu thành công!")
                .build();
    }

    @PostMapping("/{id}/add-fund")
    public ApiResponse<SavingGoalResponse> addFund(@PathVariable String id, @RequestBody @Valid FundAddRequest request) {
        return ApiResponse.<SavingGoalResponse>builder()
                .result(savingGoalService.addFund(id, request))
                .build();
    }
}