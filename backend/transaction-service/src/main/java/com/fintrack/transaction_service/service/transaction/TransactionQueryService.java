package com.fintrack.transaction_service.service.transaction;

import com.fintrack.transaction_service.dto.response.PageResponse;
import com.fintrack.transaction_service.dto.response.TransactionResponse;
import com.fintrack.transaction_service.dto.response.WalletResponse;
import com.fintrack.transaction_service.entity.Category;
import com.fintrack.transaction_service.entity.Transaction;
import com.fintrack.transaction_service.enums.TransactionType;
import com.fintrack.transaction_service.exception.AppException;
import com.fintrack.transaction_service.exception.ErrorCode;
import com.fintrack.transaction_service.mapper.TransactionMapper;
import com.fintrack.transaction_service.repository.CategoryRepository;
import com.fintrack.transaction_service.repository.TransactionRepository;
import com.fintrack.transaction_service.repository.httpclient.WalletClient;
import com.fintrack.transaction_service.repository.specification.TransactionSpecification;
import com.fintrack.transaction_service.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionQueryService {
    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final TransactionMapper transactionMapper;
    private final WalletClient walletClient;

    public long countTransactionsByWallet(String walletId) {
        return transactionRepository.countByWalletId(walletId);
    }

    public TransactionResponse getTransaction(String id) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.TRANSACTION_NOT_FOUND));
        validateAndGetWallet(transaction.getWalletId());
        return transactionMapper.toTransactionResponse(transaction);
    }

    public PageResponse<TransactionResponse> getTransactions(int page, int size, String walletId, TransactionType type, Instant startDate, Instant endDate, String categoryId, String keyword) {
        List<String> walletIdsToQuery = new ArrayList<>();
        if (walletId != null && !walletId.trim().isEmpty() && !"undefined".equals(walletId)) {
            validateAndGetWallet(walletId);
            walletIdsToQuery.add(walletId);
        } else {
            var walletResponse = walletClient.getMyWallets();
            if (walletResponse != null && walletResponse.getResult() != null) {
                walletIdsToQuery = walletResponse.getResult().stream().map(WalletResponse::getId).toList();
            }
            if (walletIdsToQuery.isEmpty()) {
                return PageResponse.<TransactionResponse>builder().currentPage(page).pageSize(size).totalElements(0).data(List.of()).build();
            }
        }

        List<String> categoryIdsToFilter = null;
        if (categoryId != null) {
            Category category = categoryRepository.findById(categoryId).orElse(null);
            if (category != null) {
                categoryIdsToFilter = new ArrayList<>();
                collectCategoryIds(category, categoryIdsToFilter);
            } else {
                categoryIdsToFilter = List.of("non-existent-id");
            }
        }

        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("createdAt").descending());
        Specification<Transaction> spec = Specification.where(TransactionSpecification.hasWalletIdIn(walletIdsToQuery))
                .and(TransactionSpecification.hasType(type))
                .and(TransactionSpecification.createdBetween(startDate, endDate))
                .and(TransactionSpecification.hasCategoryIn(categoryIdsToFilter))
                .and(TransactionSpecification.hasKeyword(keyword));

        Page<Transaction> pageData = transactionRepository.findAll(spec, pageable);
        return PageResponse.<TransactionResponse>builder()
                .currentPage(page).pageSize(pageData.getSize()).totalPages(pageData.getTotalPages()).totalElements(pageData.getTotalElements())
                .data(pageData.getContent().stream().map(transactionMapper::toTransactionResponse).toList()).build();
    }

    // --- CÁC HÀM VALIDATE DÙNG CHUNG (PUBLIC) ---

    /**
     * STRICT validation: throws exception if wallet-service is unreachable or wallet not found.
     * Dùng cho read-path (GET) nơi cần đảm bảo dữ liệu nhất quán ngay lập tức.
     */
    public WalletResponse validateAndGetWallet(String walletId) {
        if (walletId == null || walletId.trim().isEmpty() || "undefined".equals(walletId)) return null;
        try {
            var response = walletClient.getWallet(walletId);
            if (response == null || response.getResult() == null) throw new AppException(ErrorCode.WALLET_NOT_FOUND);
            if (!SecurityUtils.getCurrentUserId().equals(response.getResult().getUserId())) throw new AppException(ErrorCode.UNAUTHORIZED);
            return response.getResult();
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Lỗi xác thực ví: {}", e.getMessage());
            throw new AppException(ErrorCode.WALLET_NOT_FOUND);
        }
    }

    /**
     * LENIENT fetch: trả về null nếu wallet-service tạm thời không khả dụng.
     * Dùng cho write-path (CREATE/UPDATE/DELETE) để hỗ trợ Eventual Consistency.
     * Transaction vẫn được lưu; balance update sẽ được xử lý qua Outbox.
     */
    public WalletResponse tryGetWallet(String walletId) {
        if (walletId == null || walletId.trim().isEmpty() || "undefined".equals(walletId)) return null;
        try {
            var response = walletClient.getWallet(walletId);
            if (response == null || response.getResult() == null) {
                log.warn("Wallet {} không tìm thấy – tiếp tục theo Eventual Consistency", walletId);
                return null;
            }
            String currentUserId = SecurityUtils.getCurrentUserId();
            if (!currentUserId.equals(response.getResult().getUserId())) {
                log.warn("Wallet {} không thuộc user {} – tiếp tục theo Eventual Consistency", walletId, currentUserId);
                return null;
            }
            return response.getResult();
        } catch (Exception e) {
            log.warn("Wallet-service tạm thời không khả dụng khi lấy ví {} ({}). " +
                    "Giao dịch vẫn được lưu; cập nhật số dư sẽ xử lý qua Outbox.", walletId, e.getMessage());
            return null;
        }
    }

    public List<String> resolveWalletIds(String walletId) {
        if (walletId != null && !walletId.trim().isEmpty() && !"undefined".equals(walletId)) {
            validateAndGetWallet(walletId);
            return List.of(walletId);
        } else {
            try {
                var response = walletClient.getMyWallets();
                if (response != null && response.getResult() != null) {
                    List<String> ids = response.getResult().stream().map(WalletResponse::getId).toList();
                    return ids.isEmpty() ? Collections.emptyList() : ids;
                }
            } catch (Exception e) {
                log.error("Lỗi khi lấy danh sách ví: {}", e.getMessage());
            }
            return Collections.emptyList();
        }
    }

    private void collectCategoryIds(Category category, List<String> ids) {
        ids.add(category.getId());
        if (category.getSubCategories() != null) {
            for (Category child : category.getSubCategories()) {
                collectCategoryIds(child, ids);
            }
        }
    }
}