package com.fintrack.transaction_service.mapper;

import com.fintrack.transaction_service.dto.request.CategoryCreationRequest;
import com.fintrack.transaction_service.dto.response.CategoryResponse;
import com.fintrack.transaction_service.entity.Category;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface CategoryMapper {
    Category toCategory(CategoryCreationRequest request);
    CategoryResponse toCategoryResponse(Category category);
}
