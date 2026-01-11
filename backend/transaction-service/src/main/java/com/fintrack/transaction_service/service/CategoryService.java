package com.fintrack.transaction_service.service;

import com.fintrack.transaction_service.dto.request.CategoryCreationRequest;
import com.fintrack.transaction_service.dto.response.CategoryResponse;
import com.fintrack.transaction_service.entity.Category;
import com.fintrack.transaction_service.enums.TransactionType;
import com.fintrack.transaction_service.exception.AppException;
import com.fintrack.transaction_service.exception.ErrorCode;
import com.fintrack.transaction_service.mapper.CategoryMapper;
import com.fintrack.transaction_service.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {
    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;

    public CategoryResponse create(CategoryCreationRequest request) {
        Category category = categoryMapper.toCategory(request);

        // nếu user chọn danh mục cha
        if (request.getParentId() != null) {
            Category parent = categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_PARENT_NOT_FOUND));
            category.setParent(parent);
        }

        category = categoryRepository.save(category);
        return categoryMapper.toCategoryResponse(category);
    }

    public List<CategoryResponse> getAll(TransactionType type) {
        List<Category> categories;

        if (type == null) {
            // Lấy tất cả danh mục gốc (Cả Thu và Chi)
            categories = categoryRepository.findByParentIsNull();
        } else {
            // Lấy danh mục gốc theo loại cụ thể
            categories = categoryRepository.findByTypeAndParentIsNull(type);
        }

        // Map sang DTO (Hibernate sẽ tự động fetch subCategories khi gọi getter)
        return categories.stream()
                .map(categoryMapper::toCategoryResponse)
                .collect(Collectors.toList());
    }
}
