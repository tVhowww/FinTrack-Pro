package com.fintrack.transaction_service.dto.response;

import com.fintrack.transaction_service.enums.TransactionType;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class CategoryResponse {
    private String id;
    private String name;
    private TransactionType type;

    // List con đệ quy
    private List<CategoryResponse> subCategories;
}
