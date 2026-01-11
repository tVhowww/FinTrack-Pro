package com.fintrack.transaction_service.mapper;

import com.fintrack.transaction_service.dto.request.TransactionCreationRequest;
import com.fintrack.transaction_service.dto.response.TransactionResponse;
import com.fintrack.transaction_service.entity.Transaction;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface TransactionMapper {
    @Mapping(target = "category", ignore = true)
        // Lý do: Request chỉ có 'categoryId' (String), nhưng Entity cần object 'Category'.
        // Việc tìm Category từ DB và set vào Transaction sẽ do Service làm thủ công.
    Transaction toTransaction(TransactionCreationRequest request);

    // Config riêng để lấy thông tin từ object Category lồng bên trong:
    @Mapping(source = "category.id", target = "categoryId")
    @Mapping(source = "category.name", target = "categoryName", defaultValue = "Khác")
    TransactionResponse toTransactionResponse(Transaction transaction);
}
