package com.fintrack.transaction_service.service;

import com.fintrack.transaction_service.dto.request.BudgetCreationRequest;
import com.fintrack.transaction_service.dto.response.BudgetResponse;
import com.fintrack.transaction_service.entity.Budget;
import com.fintrack.transaction_service.entity.Category;
import com.fintrack.transaction_service.mapper.BudgetMapper;
import com.fintrack.transaction_service.repository.BudgetRepository;
import com.fintrack.transaction_service.repository.CategoryRepository;
import com.fintrack.transaction_service.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BudgetService {
    private final BudgetRepository budgetRepository;
    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final BudgetMapper budgetMapper;

    @Transactional
    public BudgetResponse create(BudgetCreationRequest request) {
        // 1. Validate: Kiểm tra trùng
        // Lưu ý: Cần xử lý trường hợp walletId null trong Repository nếu dùng Global Budget
        if (budgetRepository.existsByWalletIdAndCategoryIdAndMonthAndYear(
                request.getWalletId(), request.getCategoryId(), request.getMonth(), request.getYear())) {
            throw new RuntimeException("Ngân sách cho danh mục này đã tồn tại trong tháng " + request.getMonth());
        }

        // 2. Map & Save
        Budget budget = budgetMapper.toBudget(request);

        // Đảm bảo nếu frontend gửi chuỗi rỗng "" thì lưu là null để đúng logic Global
        if (budget.getWalletId() != null && budget.getWalletId().isEmpty()) {
            budget.setWalletId(null);
        }

        budget = budgetRepository.save(budget);

        // 3. Return
        return toBudgetResponse(budget);
    }

    public List<BudgetResponse> getBudgets(String walletId, int month, int year) {
        // Nếu walletId được truyền vào: Lấy budget của ví đó + budget Global (null)
        // Nếu walletId null/rỗng: Chỉ lấy Global hoặc lấy tất cả (Tùy logic bạn muốn).
        // Ở đây giả định: Lấy budget của ví này + budget chung.

        List<Budget> budgets;
        if (walletId != null && !walletId.isEmpty()) {
            budgets = budgetRepository.findBudgetsForWallet(walletId, month, year);
        } else {
            // Lấy toàn bộ budget global
            budgets = budgetRepository.findByWalletIdIsNullAndMonthAndYear(month, year);
        }

        return budgets.stream().map(this::toBudgetResponse).toList();
    }

    @Transactional
    public void delete(String id) {
        budgetRepository.deleteById(id);
    }

    private BudgetResponse toBudgetResponse(Budget budget) {
        // 1. Xác định thời gian
        YearMonth yearMonth = YearMonth.of(budget.getYear(), budget.getMonth());
        var start = yearMonth.atDay(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
        var end = yearMonth.atEndOfMonth().atTime(23, 59, 59).atZone(ZoneId.systemDefault()).toInstant();

        // 2. Tính tổng tiền đã tiêu
        BigDecimal spentAmountRaw;

        if (budget.getWalletId() != null && !budget.getWalletId().isEmpty()) {
            // Tính theo ví cụ thể
            spentAmountRaw = transactionRepository.sumAmountByWalletAndCategoryAndTypeAndDateBetween(
                    budget.getWalletId(), budget.getCategoryId(), start, end
            );
        } else {
            // Tính Global (tất cả ví)
            spentAmountRaw = transactionRepository.sumAmountByCategoryAndTypeAndDateBetween(
                    budget.getCategoryId(), start, end
            );
        }

        BigDecimal spentAmount = (spentAmountRaw == null) ? BigDecimal.ZERO : spentAmountRaw.abs();

        // 3. Tính phần trăm (%)
        double percentage = 0;
        if (budget.getAmount().compareTo(BigDecimal.ZERO) > 0) {
            percentage = spentAmount.divide(budget.getAmount(), 4, RoundingMode.HALF_UP).doubleValue() * 100;
        }

        // 4. Lấy tên Category
        String categoryName = categoryRepository.findById(budget.getCategoryId())
                .map(Category::getName).orElse("Unknown");

        // 5. Build Response
        return BudgetResponse.builder()
                .id(budget.getId())
                .name(budget.getName())
                .amount(budget.getAmount())
                .spentAmount(spentAmount)
                .percentage(percentage)
                .walletId(budget.getWalletId())
                .categoryId(budget.getCategoryId())
                .categoryName(categoryName)
                .month(budget.getMonth())
                .year(budget.getYear())
                .build();
    }
}