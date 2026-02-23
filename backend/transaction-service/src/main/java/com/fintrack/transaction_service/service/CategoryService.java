package com.fintrack.transaction_service.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fintrack.transaction_service.dto.request.CategoryCreationRequest;
import com.fintrack.transaction_service.dto.response.CategoryResponse;
import com.fintrack.transaction_service.entity.Category;
import com.fintrack.transaction_service.enums.TransactionType;
import com.fintrack.transaction_service.exception.AppException;
import com.fintrack.transaction_service.exception.ErrorCode;
import com.fintrack.transaction_service.mapper.CategoryMapper;
import com.fintrack.transaction_service.repository.CategoryRepository;
import com.fintrack.transaction_service.repository.TransactionRepository;
import com.fintrack.transaction_service.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CategoryService {
    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;
    private final CategoryMapper categoryMapper;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public CategoryResponse create(CategoryCreationRequest request) {
        // Lấy userId từ Token (bắt buộc)
        String userId = SecurityUtils.getCurrentUserId();

        // 1. Check trùng tên
        boolean exists = categoryRepository.existsByNameAndUserIdAndTypeAndDeletedFalse(request.getName(), userId, request.getType());
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

        clearCategoryCache(userId);
        return categoryMapper.toCategoryResponse(category);
    }

    public List<CategoryResponse> getAll(TransactionType type) {
        String userId = SecurityUtils.getCurrentUserId();
        String typeKey = (type == null) ? "ALL" : type.name();
        String redisKey = "categories:" + userId + ":" + typeKey;

        // 1. Kiểm tra Redis trước (Cache Hit)
        try {
            String cachedData = redisTemplate.opsForValue().get(redisKey);
            if (cachedData != null) {
                log.info("Lấy danh mục từ Redis siêu tốc cho user: {}", userId);
                return objectMapper.readValue(cachedData, new TypeReference<List<CategoryResponse>>() {});
            }
        } catch (Exception e) {
            log.warn("Lỗi đọc Redis, sẽ query DB: {}", e.getMessage());
        }

        // 2. Nếu Redis KHÔNG CÓ (Cache Miss), mới chạy xuống DB
        log.info("Lấy danh mục từ Database cho user: {}", userId);
        List<Category> categories;
        if (type == null) {
            categories = categoryRepository.findAllRootCategories(userId);
        } else {
            categories = categoryRepository.findAllRootCategoriesByType(userId, type);
        }

        List<CategoryResponse> responses = categories.stream()
                .map(categoryMapper::toCategoryResponse)
                .collect(Collectors.toList());

        // 3. Cất vào Redis để lần sau xài (Lưu 24 tiếng)
        try {
            redisTemplate.opsForValue().set(redisKey, objectMapper.writeValueAsString(responses), 24, TimeUnit.HOURS);
        } catch (Exception e) {
            log.warn("Không thể lưu cache vào Redis: {}", e.getMessage());
        }

        return responses;
    }

    public CategoryResponse update(String id, CategoryCreationRequest request) {
        String userId = SecurityUtils.getCurrentUserId();

        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        // Security Check
        if (category.getUserId() == null) throw new AppException(ErrorCode.CATEGORY_SYSTEM_READONLY);
        if (!userId.equals(category.getUserId())) throw new AppException(ErrorCode.CATEGORY_NOT_FOUND);

        // 1. Update Tên & Mô tả
        if (!category.getName().equalsIgnoreCase(request.getName())) {
            // Check trùng (loại trừ chính nó thì không cần, vì tên đã khác thì mới check)
            boolean exists = categoryRepository.existsByNameAndUserIdAndTypeAndDeletedFalse(
                    request.getName(), userId, category.getType());
            if (exists) throw new AppException(ErrorCode.CATEGORY_EXISTED);
            category.setName(request.getName());
        }
        category.setDescription(request.getDescription());

        // 2. Update Danh mục Cha (Di chuyển danh mục)
        // Nếu request có gửi parentId và nó KHÁC với parent hiện tại
        String oldParentId = category.getParent() != null ? category.getParent().getId() : null;
        String newParentId = request.getParentId();

        // Chỉ xử lý khi có sự thay đổi cha
        if (newParentId != null && !newParentId.equals(oldParentId)) {
            // Tìm cha mới
            Category newParent = categoryRepository.findById(newParentId)
                    .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

            // Validate: Cha mới phải cùng Type
            if (newParent.getType() != category.getType()) {
                throw new AppException(ErrorCode.CATEGORY_TYPE_MISMATCH);
            }
            // Validate: Không được chọn chính mình hoặc con cháu làm cha (Tránh vòng lặp)
            if (newParent.getId().equals(category.getId())) {
                throw new AppException(ErrorCode.CATEGORY_INVALID_PARENT);
            }

            category.setParent(newParent);
        }
        else if (newParentId == null && oldParentId != null) {
            // Trường hợp user muốn chuyển từ Con thành Gốc (Bỏ cha)
            category.setParent(null);
        }

        clearCategoryCache(userId);

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

        // Security Check
        if (category.getUserId() == null) throw new AppException(ErrorCode.CATEGORY_SYSTEM_READONLY);
        if (!userId.equals(category.getUserId())) throw new AppException(ErrorCode.CATEGORY_NOT_FOUND);

        // 1. Lấy danh sách ID của chính nó và tất cả con cháu
        List<String> allRelatedIds = new ArrayList<>();
        collectCategoryIds(category, allRelatedIds);

        // 2. Xóa mềm tất cả GIAO DỊCH thuộc các category này
        transactionRepository.softDeleteByCategoryIds(allRelatedIds);

        // 3. Xóa mềm tất cả DANH MỤC (Logic cũ)
        softDeleteCategoryRecursive(category);
        categoryRepository.save(category);
        clearCategoryCache(userId);
    }

    // Hàm đệ quy lấy ID
    private void collectCategoryIds(Category category, List<String> ids) {
        ids.add(category.getId());
        if (category.getSubCategories() != null) {
            for (Category child : category.getSubCategories()) {
                collectCategoryIds(child, ids);
            }
        }
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

    // Xoá toàn bộ cache danh mục của 1 User
    private void clearCategoryCache(String userId) {
        redisTemplate.delete(Arrays.asList(
                "categories:" + userId + ":ALL",
                "categories:" + userId + ":INCOME",
                "categories:" + userId + ":EXPENSE"
        ));
        log.info("Đã xóa cache Category của user: {}", userId);
    }
}
