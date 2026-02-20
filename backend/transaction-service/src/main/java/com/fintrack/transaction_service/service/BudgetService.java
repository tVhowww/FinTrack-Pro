package com.fintrack.transaction_service.service;

import com.fintrack.transaction_service.dto.request.BudgetCreationRequest;
import com.fintrack.transaction_service.dto.request.BudgetUpdateRequest;
import com.fintrack.transaction_service.dto.response.BudgetResponse;
import com.fintrack.transaction_service.dto.response.WalletResponse;
import com.fintrack.transaction_service.entity.Budget;
import com.fintrack.transaction_service.entity.Category;
import com.fintrack.transaction_service.entity.Transaction;
import com.fintrack.transaction_service.enums.TransactionType;
import com.fintrack.transaction_service.exception.AppException;
import com.fintrack.transaction_service.exception.ErrorCode;
import com.fintrack.transaction_service.mapper.BudgetMapper;
import com.fintrack.transaction_service.repository.BudgetRepository;
import com.fintrack.transaction_service.repository.CategoryRepository;
import com.fintrack.transaction_service.repository.TransactionRepository;
import com.fintrack.transaction_service.repository.httpclient.IdentityClient;
import com.fintrack.transaction_service.repository.httpclient.WalletClient;
import com.fintrack.transaction_service.repository.specification.TransactionSpecification;
import com.fintrack.transaction_service.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BudgetService {
    private final BudgetRepository budgetRepository;
    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final BudgetMapper budgetMapper;
    private final WalletClient walletClient;
    private final IdentityClient identityClient;
    private final CurrencyConverterService currencyConverterService;

    /**
     * Lấy danh sách Budget (Xử lý 3 trường hợp: Tất cả, Ví chung, Ví cụ thể)
     */
    public List<BudgetResponse> getBudgets(String walletId, int month, int year) {
        String userId = SecurityUtils.getCurrentUserId();
        List<Budget> budgets;

        // Phân loại 3 trường hợp
        if ("all".equals(walletId) || walletId == null || walletId.trim().isEmpty() || "undefined".equals(walletId)) {
            // Trường hợp 1: "Tất cả các ví" -> Lấy TẤT CẢ
            budgets = budgetRepository.findByMonthAndYearAndUserId(month, year, userId);

        } else if ("global".equals(walletId)) {
            // Trường hợp 2: "Ngân sách chung" -> Chỉ lấy ngân sách Global (walletId = null)
            budgets = budgetRepository.findByWalletIdIsNullAndMonthAndYearAndUserId(month, year, userId);

        } else {
            // Trường hợp 3: Chọn "1 Ví cụ thể" -> Lấy của ví đó + Ngân sách chung
            budgets = budgetRepository.findBudgetsForWallet(walletId, month, year, userId);
        }

        if (budgets.isEmpty()) return new ArrayList<>();

        // Cache danh sách ví của User (Để dùng tính spentAmount cho Global Budget)
        List<WalletResponse> allMyWallets = getAllMyWallets();

        // Map và tính toán số tiền đã chi tiêu
        return budgets.stream()
                .map(budget -> mapToBudgetResponse(budget, allMyWallets))
                .toList();
    }

    @Transactional
    public BudgetResponse create(BudgetCreationRequest request) {
        String userId = SecurityUtils.getCurrentUserId();

        // 1. Validate trùng
        if (budgetRepository.existsByWalletIdAndCategoryIdAndMonthAndYearAndUserId(
                request.getWalletId(), request.getCategoryId(), request.getMonth(), request.getYear(), userId)) {
            throw new AppException(ErrorCode.BUDGET_ALREADY_EXISTS);
        }

        // 2. Map & Save
        Budget budget = budgetMapper.toBudget(request);
        budget.setUserId(userId);

        // Xử lý walletId rỗng -> null
        if (budget.getWalletId() != null && budget.getWalletId().trim().isEmpty()) {
            budget.setWalletId(null);
        }

        budget = budgetRepository.save(budget);

        // 3. Return (Tính toán luôn số tiền đã chi tiêu nếu có)
        return mapToBudgetResponse(budget, getAllMyWallets());
    }

    @Transactional
    public BudgetResponse update(String id, BudgetUpdateRequest request) {
        String userId = SecurityUtils.getCurrentUserId();

        // 1. Tìm ngân sách và kiểm tra quyền sở hữu
        Budget budget = budgetRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new AppException(ErrorCode.BUDGET_NOT_FOUND));

        // 2. Cập nhật thông tin cho phép sửa
        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            budget.setName(request.getName());
        }
        if (request.getAmount() != null && request.getAmount().compareTo(BigDecimal.ZERO) > 0) {
            budget.setAmount(request.getAmount());
        }

        budget = budgetRepository.save(budget);

        // 3. Trả về Response (tính toán lại % dựa trên số tiền mới)
        return mapToBudgetResponse(budget, getAllMyWallets());
    }

    @Transactional
    public void delete(String id) {
        String userId = SecurityUtils.getCurrentUserId();
        Budget budget = budgetRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ngân sách"));
        budgetRepository.delete(budget);
    }

    /**
     * Helper: Map Entity -> Response và tính toán Spent Amount
     */
    private BudgetResponse mapToBudgetResponse(Budget budget, List<WalletResponse> allMyWallets) {
        YearMonth yearMonth = YearMonth.of(budget.getYear(), budget.getMonth());
        Instant start = yearMonth.atDay(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant end = yearMonth.atEndOfMonth().atTime(23, 59, 59).atZone(ZoneId.systemDefault()).toInstant();

        List<String> targetWalletIds = new ArrayList<>();
        String walletName = "Ngân sách chung";
        String baseCurrency = getUserBaseCurrency(); // Lấy loại tiền của User

        // Tạo Map dò tiền tệ của từng ví
        java.util.Map<String, String> walletCurrencyMap = new java.util.HashMap<>();
        for (WalletResponse w : allMyWallets) {
            walletCurrencyMap.put(w.getId(), w.getCurrency());
        }

        if (budget.getWalletId() != null) {
            targetWalletIds.add(budget.getWalletId());
            for (WalletResponse w : allMyWallets) {
                if (w.getId().equals(budget.getWalletId())) {
                    walletName = w.getName();
                    break;
                }
            }
        } else {
            targetWalletIds = allMyWallets.stream().map(WalletResponse::getId).toList();
        }

        BigDecimal spentAmount = BigDecimal.ZERO;

        if (!targetWalletIds.isEmpty()) {
            // Lấy danh sách giao dịch thay vì cộng chay bằng Database
            var spec = Specification.where(
                            TransactionSpecification.hasWalletIdIn(targetWalletIds)
                    ).and(TransactionSpecification.hasType(TransactionType.EXPENSE))
                    .and(TransactionSpecification.hasCategoryIn(List.of(budget.getCategoryId())))
                    .and(TransactionSpecification.createdBetween(start, end));

            List<Transaction> transactions = transactionRepository.findAll(spec);

            // Cộng dồn qua máy quy đổi
            for (var tx : transactions) {
                String txCurrency = walletCurrencyMap.getOrDefault(tx.getWalletId(), "VND");
                BigDecimal converted = currencyConverterService.convertCurrency(tx.getAmount().abs(), txCurrency, baseCurrency);
                spentAmount = spentAmount.add(converted);
            }
        }

        double percentage = 0;
        if (budget.getAmount().compareTo(BigDecimal.ZERO) > 0) {
            percentage = spentAmount.divide(budget.getAmount(), 4, RoundingMode.HALF_UP).doubleValue() * 100;
        }

        String categoryName = categoryRepository.findById(budget.getCategoryId())
                .map(Category::getName).orElse("Unknown");

        return BudgetResponse.builder()
                .id(budget.getId())
                .name(budget.getName())
                .amount(budget.getAmount()) // Amount này được hiểu là theo BaseCurrency
                .spentAmount(spentAmount)
                .percentage(percentage)
                .walletId(budget.getWalletId())
                .walletName(walletName)
                .categoryId(budget.getCategoryId())
                .categoryName(categoryName)
                .month(budget.getMonth())
                .year(budget.getYear())
                .build();
    }

    // --- Helper lấy danh sách ví ---
    private List<WalletResponse> getAllMyWallets() {
        try {
            var response = walletClient.getMyWallets();
            if (response != null && response.getResult() != null) {
                return response.getResult();
            }
        } catch (Exception e) {
            log.error("Lỗi khi lấy danh sách ví: {}", e.getMessage());
        }
        return Collections.emptyList();
    }

    private String getUserBaseCurrency() {
        try {
            var userResponse = identityClient.getMyInfo();
            if (userResponse != null && userResponse.getResult() != null && userResponse.getResult().getBaseCurrency() != null) {
                return userResponse.getResult().getBaseCurrency();
            }
        } catch (Exception e) {
            log.error("Không lấy được Base Currency, dùng mặc định VND", e);
        }
        return "VND";
    }
}