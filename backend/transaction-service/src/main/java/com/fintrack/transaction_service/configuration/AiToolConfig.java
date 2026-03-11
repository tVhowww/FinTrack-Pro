package com.fintrack.transaction_service.configuration;

import com.fintrack.transaction_service.dto.response.*;
import com.fintrack.transaction_service.service.BudgetService;
import com.fintrack.transaction_service.service.TransactionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class AiToolConfig {

    private final TransactionService transactionService;
    private final BudgetService budgetService;

    @Tool(description = "Tra cứu dữ liệu thống kê tài chính, tổng thu, tổng chi và danh sách khoản chi tiêu của người dùng theo tháng và năm.")
    public String getFinancialData(int month, int year) {
        MonthlyStatisticsResponse stats = transactionService.getMonthlyStatistics(null, month, year);
        List<ExpenseStructureResponse> structures = transactionService.getExpenseStructure(null, month, year);
        List<TransactionResponse> topExpenses = transactionService.getHighestExpenses(null, month, year);

        StringBuilder data = new StringBuilder();
        data.append("DỮ LIỆU THÁNG ").append(month).append("/").append(year).append(":\n");
        data.append("- Tổng thu: ").append(stats.getTotalIncome()).append("\n");
        data.append("- Tổng chi: ").append(stats.getTotalExpense()).append("\n");
        data.append("- Tiết kiệm: ").append(stats.getNetSavings()).append("\n\n");

        data.append("CƠ CẤU CHI TIÊU:\n");
        for (ExpenseStructureResponse s : structures) {
            data.append(String.format("- %s: %s (%.2f%%)\n", s.getCategoryName(), s.getAmount(), s.getPercentage()));
        }

        data.append("\nTOP 5 KHOẢN CHI LỚN NHẤT:\n");
        for (TransactionResponse t : topExpenses) {
            String note = (t.getNote() != null && !t.getNote().isEmpty()) ? t.getNote() : "Không ghi chú";
            String dateStr = t.getDate().toString();
            String shortDate = dateStr.length() >= 10 ? dateStr.substring(0, 10) : dateStr;
            data.append(String.format("- Ngày %s: %s (%s) - Danh mục: %s\n", shortDate, t.getAmount(), note, t.getCategoryName()));
        }

        return data.toString();
    }

    @Tool(description = "Tra cứu tình hình sử dụng ngân sách (budget) của người dùng trong một tháng và năm cụ thể. Trả về tổng ngân sách, số tiền đã tiêu và số tiền còn lại của từng danh mục.")
    public String checkBudgetStatus(int month, int year) {
        // Gọi hàm getBudgets của bác: Lấy tất cả ví ("all"), truyền tháng/năm, và không có keyword (null)
        // Lưu ý: getBudgets đã tự động móc SecurityUtils.getCurrentUserId() ở bên trong rồi nên không cần truyền userId nữa.
        List<BudgetResponse> budgets = budgetService.getBudgets("all", month, year, null);

        if (budgets == null || budgets.isEmpty()) {
            return "Sếp chưa thiết lập bất kỳ ngân sách nào cho tháng " + month + "/" + year + " ạ. Sếp có muốn tạo mới không?";
        }

        StringBuilder data = new StringBuilder();
        data.append("TÌNH HÌNH NGÂN SÁCH THÁNG ").append(month).append("/").append(year).append(":\n");

        for (BudgetResponse b : budgets) {
            // Tính số tiền còn lại
            BigDecimal remaining = b.getAmount().subtract(b.getSpentAmount());

            // Đánh giá mức độ an toàn để mớm cho AI mắng user
            String alertStatus = "(An toàn)";
            if (b.getPercentage() >= 100) {
                alertStatus = "(BÁO ĐỘNG ĐỎ: Đã vượt ngân sách " + String.format("%.1f", b.getPercentage() - 100) + "%)";
            } else if (b.getPercentage() >= 80) {
                alertStatus = "(Cảnh báo: Đã dùng " + String.format("%.1f", b.getPercentage()) + "%)";
            }

            data.append(String.format("- Ngân sách [%s]: Tổng %s | Đã tiêu %s | Còn lại %s %s\n",
                    b.getName(), b.getAmount(), b.getSpentAmount(), remaining, alertStatus));
        }

        return data.toString();
    }

}