package com.fintrack.transaction_service.service.budget;

import com.fintrack.transaction_service.dto.request.BudgetCreationRequest;
import com.fintrack.transaction_service.dto.request.BudgetUpdateRequest;
import com.fintrack.transaction_service.dto.response.BudgetResponse;
import com.fintrack.transaction_service.dto.response.WalletResponse;
import com.fintrack.transaction_service.entity.Budget;
import com.fintrack.transaction_service.entity.Category;
import com.fintrack.transaction_service.entity.Transaction;
import com.fintrack.transaction_service.enums.BudgetStatus;
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
import com.fintrack.transaction_service.service.currency.CurrencyConverterService;
import com.fintrack.transaction_service.utils.SecurityUtils;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.*;
import java.util.concurrent.TimeUnit;

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
    private final StringRedisTemplate redisTemplate;

    /**
     * Lấy danh sách Budget (Xử lý 3 trường hợp: Tất cả, Ví chung, Ví cụ thể)
     */
    public List<BudgetResponse> getBudgets(String walletId, int month, int year, String keyword) {
        String userId = SecurityUtils.getCurrentUserId();

        // 1. Dùng Specification để build query động siêu mạnh
        Specification<Budget> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Điều kiện bắt buộc: userId, month, year
            predicates.add(cb.equal(root.get("userId"), userId));
            predicates.add(cb.equal(root.get("month"), month));
            predicates.add(cb.equal(root.get("year"), year));

            // Xử lý logic WalletId
            if ("global".equals(walletId)) {
                predicates.add(cb.isNull(root.get("walletId")));
            } else if (walletId != null && !walletId.trim().isEmpty() && !"all".equals(walletId) && !"undefined".equals(walletId)) {
                // Nếu chọn 1 ví cụ thể: Lấy của ví đó HOẶC ví chung (global)
                predicates.add(cb.or(
                        cb.equal(root.get("walletId"), walletId),
                        cb.isNull(root.get("walletId"))
                ));
            }
            // Nếu "all" thì không add thêm điều kiện wallet (Lấy sạch sành sanh)

            if (keyword != null && !keyword.trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("name")), "%" + keyword.toLowerCase() + "%"));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        // Quét DB 1 phát lấy ra danh sách Budget
        List<Budget> budgets = budgetRepository.findAll(spec);

        if (budgets.isEmpty()) return new ArrayList<>();

        List<WalletResponse> allMyWallets = getAllMyWallets();

        return budgets.stream()
                .map(budget -> mapToBudgetResponse(budget, allMyWallets))
                .toList();
    }

    @Transactional
    public BudgetResponse create(BudgetCreationRequest request) {
        String userId = SecurityUtils.getCurrentUserId();

        String lockKey = "lock:create_budget:" + userId;
        Boolean acquired = redisTemplate.opsForValue().setIfAbsent(lockKey, "LOCKED", 3, TimeUnit.SECONDS);
        if (Boolean.FALSE.equals(acquired)) {
            log.warn("Double-Click chặn đứng! User {} đang tạo Budget.", userId);
            throw new AppException(ErrorCode.REQUEST_PROCESSING);
        }

        // 1. Validate trùng
        if (budgetRepository.existsByWalletIdAndCategoryIdAndMonthAndYearAndUserId(
                request.getWalletId(), request.getCategoryId(), request.getMonth(), request.getYear(), userId)) {
            throw new AppException(ErrorCode.BUDGET_ALREADY_EXISTS);
        }

        // 2. Map & Save
        Budget budget = budgetMapper.toBudget(request);
        budget.setUserId(userId);

        budget.setCurrency(getUserBaseCurrency());

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
            budget.setCurrency(getUserBaseCurrency());
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

    // --- Helper: Gom ID của Danh mục cha và toàn bộ Danh mục con ---
    private void collectCategoryIds(Category category, List<String> ids) {
        ids.add(category.getId());
        if (category.getSubCategories() != null) {
            for (Category child : category.getSubCategories()) {
                collectCategoryIds(child, ids); // Đệ quy lôi hết con cháu vào
            }
        }
    }

    /**
     * Helper: Map Entity -> Response và tính toán Spent Amount & Status
     */
    private BudgetResponse mapToBudgetResponse(Budget budget, List<WalletResponse> allMyWallets) {
        YearMonth yearMonth = YearMonth.of(budget.getYear(), budget.getMonth());
        Instant start = yearMonth.atDay(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant end = yearMonth.atEndOfMonth().atTime(23, 59, 59).atZone(ZoneId.systemDefault()).toInstant();

        List<String> targetWalletIds = new ArrayList<>();
        String walletName = "Ngân sách chung";
        String baseCurrency = getUserBaseCurrency();

        // Tạo Map dò tiền tệ của từng ví
        Map<String, String> walletCurrencyMap = new HashMap<>();
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
            List<String> categoryIdsToFilter = new ArrayList<>();
            categoryRepository.findById(budget.getCategoryId()).ifPresentOrElse(
                    cat -> collectCategoryIds(cat, categoryIdsToFilter),
                    () -> categoryIdsToFilter.add(budget.getCategoryId()) // Fallback nếu lỗi
            );

            var spec = Specification.where(
                            TransactionSpecification.hasWalletIdIn(targetWalletIds)
                    ).and(TransactionSpecification.hasType(TransactionType.EXPENSE))
                    .and(TransactionSpecification.hasCategoryIn(categoryIdsToFilter))
                    .and(TransactionSpecification.createdBetween(start, end));

            List<Transaction> transactions = transactionRepository.findAll(spec);

            // Cộng dồn qua máy quy đổi
            for (var tx : transactions) {
                String txCurrency = walletCurrencyMap.getOrDefault(tx.getWalletId(), "VND");
                BigDecimal converted = currencyConverterService.convertCurrency(tx.getAmount().abs(), txCurrency, baseCurrency);
                spentAmount = spentAmount.add(converted);
            }
        }

        String budgetCurrency = budget.getCurrency() != null ? budget.getCurrency() : "VND";
        BigDecimal displayAmount = currencyConverterService.convertCurrency(
                budget.getAmount(),
                budgetCurrency,
                baseCurrency
        );

        double percentage = 0;
        if (displayAmount.compareTo(BigDecimal.ZERO) > 0) {
            percentage = spentAmount.divide(displayAmount, 4, RoundingMode.HALF_UP).doubleValue() * 100;
        }

        BudgetStatus status;
        YearMonth currentYearMonth = YearMonth.now();
        YearMonth budgetYearMonth = YearMonth.of(budget.getYear(), budget.getMonth());

        if (spentAmount.compareTo(displayAmount) >= 0) {
            status = BudgetStatus.EXCEEDED; // Ưu tiên 1: Đã tiêu lố (dù quá khứ hay hiện tại)
        } else if (budgetYearMonth.isBefore(currentYearMonth)) {
            status = BudgetStatus.EXPIRED; // Ưu tiên 2: Xài chưa hết nhưng đã qua tháng
        } else if (budgetYearMonth.isAfter(currentYearMonth)) {
            status = BudgetStatus.UPCOMING; // Ưu tiên 3: Ngân sách tháng sau
        } else {
            status = BudgetStatus.ACTIVE; // Ưu tiên 4: Đang trong tháng hiện tại và còn tiền
        }

        String categoryName = categoryRepository.findById(budget.getCategoryId())
                .map(Category::getName).orElse("Unknown");

        return BudgetResponse.builder()
                .id(budget.getId())
                .name(budget.getName())
                .amount(displayAmount)
                .spentAmount(spentAmount)
                .percentage(percentage)
                .walletId(budget.getWalletId())
                .walletName(walletName)
                .categoryId(budget.getCategoryId())
                .categoryName(categoryName)
                .month(budget.getMonth())
                .year(budget.getYear())
                .status(status)
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