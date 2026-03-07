package com.fintrack.transaction_service.configuration;

import com.fintrack.transaction_service.dto.response.ExpenseStructureResponse;
import com.fintrack.transaction_service.dto.response.MonthlyStatisticsResponse;
import com.fintrack.transaction_service.dto.response.TransactionResponse;
import com.fintrack.transaction_service.service.TransactionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class AiToolConfig {

    private final TransactionService transactionService;

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
}