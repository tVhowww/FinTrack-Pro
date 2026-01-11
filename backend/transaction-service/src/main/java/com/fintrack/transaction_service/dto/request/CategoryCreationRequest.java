package com.fintrack.transaction_service.dto.request;

import com.fintrack.transaction_service.enums.TransactionType;
import lombok.Data;

@Data
public class CategoryCreationRequest {
    private String name;
    private TransactionType type;
    private String description;
    private String parentId;
}
