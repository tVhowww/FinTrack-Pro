package com.fintrack.transaction_service.controller;

import com.fintrack.transaction_service.dto.request.CategoryCreationRequest;
import com.fintrack.transaction_service.dto.response.ApiResponse;
import com.fintrack.transaction_service.dto.response.CategoryResponse;
import com.fintrack.transaction_service.enums.TransactionType;
import com.fintrack.transaction_service.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/categories")
@RequiredArgsConstructor
public class CategoryController {
    private final CategoryService categoryService;

    @PostMapping
    ApiResponse<CategoryResponse> createCategory(@RequestBody CategoryCreationRequest request) {
        return ApiResponse.<CategoryResponse>builder()
                .result(categoryService.create(request))
                .build();
    }

    @GetMapping
    ApiResponse<java.util.List<CategoryResponse>> getAllCategories(
            @RequestParam(value = "type", required = false) TransactionType type
    ) {
        return ApiResponse.<List<CategoryResponse>>builder()
                .result(categoryService.getAll(type))
                .build();
    }

    @PutMapping("/{id}")
    ApiResponse<CategoryResponse> updateCategory(@PathVariable String id, @RequestBody CategoryCreationRequest request) {
        return ApiResponse.<CategoryResponse>builder()
                .result(categoryService.update(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    ApiResponse<String> deleteCategory(@PathVariable String id) {
        categoryService.delete(id);
        return ApiResponse.<String>builder()
                .result("Category has been deleted")
                .build();
    }
}
