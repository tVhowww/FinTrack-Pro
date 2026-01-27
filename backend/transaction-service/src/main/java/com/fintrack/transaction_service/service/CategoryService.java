package com.fintrack.transaction_service.service;

import com.fintrack.transaction_service.dto.request.CategoryCreationRequest;
import com.fintrack.transaction_service.dto.response.CategoryResponse;
import com.fintrack.transaction_service.entity.Category;
import com.fintrack.transaction_service.enums.TransactionType;
import com.fintrack.transaction_service.exception.AppException;
import com.fintrack.transaction_service.exception.ErrorCode;
import com.fintrack.transaction_service.mapper.CategoryMapper;
import com.fintrack.transaction_service.repository.CategoryRepository;
import com.fintrack.transaction_service.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {
    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;

    public CategoryResponse create(CategoryCreationRequest request) {
        // Lấy userId từ Token (bắt buộc)
        String userId = SecurityUtils.getCurrentUserId();

        // 1. Check trùng tên
        boolean exists = categoryRepository.existsByNameAndUserIdAndType(request.getName(), userId, request.getType());
        if (exists) throw new AppException(ErrorCode.CATEGORY_EXISTED);

        Category category = categoryMapper.toCategory(request);
        category.setUserId(userId); // Gán chủ sở hữu

        // 2. Xử lý logic cha - con
        if (request.getParentId() != null) {
            Category parent = categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

            // Chỉ cho phép gán cha nếu:
            // 1. Cha là danh mục hệ thống (userId == null)
            // 2. HOẶC Cha là danh mục của chính user này
            boolean isSystemCategory = parent.getUserId() == null;
            boolean isMyCategory = userId.equals(parent.getUserId());

            if (!isSystemCategory && !isMyCategory) {
                // Nếu cố tình gán vào danh mục người khác -> Báo lỗi không tìm thấy
                throw new AppException(ErrorCode.CATEGORY_NOT_FOUND);
            }

            // Validate Type
            if (parent.getType() != request.getType()) {
                throw new AppException(ErrorCode.CATEGORY_TYPE_MISMATCH);
            }

            category.setParent(parent);
        }

        category = categoryRepository.save(category);
        return categoryMapper.toCategoryResponse(category);
    }

    public List<CategoryResponse> getAll(TransactionType type) {
        String userId = SecurityUtils.getCurrentUserId();
        List<Category> categories;

        if (type == null) {
            categories = categoryRepository.findAllRootCategories(userId);
        } else {
            categories = categoryRepository.findAllRootCategoriesByType(userId, type);
        }

        return categories.stream()
                .map(categoryMapper::toCategoryResponse)
                .collect(Collectors.toList());
    }

    public CategoryResponse update(String id, CategoryCreationRequest request) {
        String userId = SecurityUtils.getCurrentUserId();

        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        // 1. Nếu là danh mục hệ thống (userId == null) -> KHÔNG CHO SỬA
        if (category.getUserId() == null) {
            throw new AppException(ErrorCode.CATEGORY_SYSTEM_READONLY); // Cần định nghĩa lỗi này
        }

        // 2. Nếu là danh mục của người khác -> KHÔNG CHO SỬA
        if (!userId.equals(category.getUserId())) {
            throw new AppException(ErrorCode.CATEGORY_NOT_FOUND);
        }

        // 3. Logic update
        // Check trùng tên (nếu tên thay đổi)
        if (!category.getName().equalsIgnoreCase(request.getName())) {
            boolean exists = categoryRepository.existsByNameAndUserIdAndType(request.getName(), userId, category.getType());
            if (exists) throw new AppException(ErrorCode.CATEGORY_EXISTED);
            category.setName(request.getName());
        }

        category.setDescription(request.getDescription());
        // Lưu ý: Thường thì ít khi cho đổi Type (Thu -> Chi) vì sẽ làm hỏng lịch sử giao dịch cũ
        // category.setType(request.getType()); <--- Cân nhắc kỹ nếu muốn bật cái này

        return categoryMapper.toCategoryResponse(categoryRepository.save(category));
    }

    /**
     * Xóa danh mục (Soft Delete)
     */
    @Transactional
    public void delete(String id) {
        String userId = SecurityUtils.getCurrentUserId();

        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        // 1. Không được xóa danh mục hệ thống
        if (category.getUserId() == null) {
            throw new AppException(ErrorCode.CATEGORY_SYSTEM_READONLY);
        }
        // 2. Không được xóa danh mục người khác
        if (!userId.equals(category.getUserId())) {
            throw new AppException(ErrorCode.CATEGORY_NOT_FOUND);
        }

        // SOFT DELETE logic
        softDeleteCategoryRecursive(category);

        categoryRepository.save(category);
    }

    /**
     * Hàm đệ quy để set deleted = true cho category và tất cả con cháu của nó
     */
    private void softDeleteCategoryRecursive(Category category) {
        // 1. Xóa chính nó
        category.setDeleted(true);

        // 2. Kiểm tra xem có con không
        if (category.getSubCategories() != null && !category.getSubCategories().isEmpty()) {
            // 3. Duyệt qua từng đứa con và gọi lại hàm này (Đệ quy)
            for (Category child : category.getSubCategories()) {
                softDeleteCategoryRecursive(child);
            }
        }
    }
}
