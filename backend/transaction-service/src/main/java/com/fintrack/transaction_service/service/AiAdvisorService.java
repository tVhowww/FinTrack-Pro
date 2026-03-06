package com.fintrack.transaction_service.service;

import com.fintrack.transaction_service.dto.response.BalanceTrendResponse;
import com.fintrack.transaction_service.dto.response.ExpenseStructureResponse;
import com.fintrack.transaction_service.dto.response.MonthlyStatisticsResponse;
import com.fintrack.transaction_service.dto.response.TransactionResponse;
import com.fintrack.transaction_service.utils.SecurityUtils;
import com.fintrack.transaction_service.utils.SimpleChatMemory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@Slf4j
public class AiAdvisorService {

    private final ChatClient chatClient;
    private final TransactionService transactionService;
    private final ChatMemory chatMemory = new SimpleChatMemory();

    public AiAdvisorService(ChatClient.Builder chatClientBuilder, TransactionService transactionService) {
        this.chatClient = chatClientBuilder.build();
        this.transactionService = transactionService;
    }

    public String chatWithAdvisor(String userMessage) {
        // Lấy ID của Sếp đang chat để làm Session ID
        String currentUserId = SecurityUtils.getCurrentUserId();

        LocalDate now = LocalDate.now();
        int month = now.getMonthValue();
        int year = now.getYear();

        // 1. LẤY DATA CHI TIẾT THÁNG HIỆN TẠI
        MonthlyStatisticsResponse stats = transactionService.getMonthlyStatistics(null, month, year);
        List<ExpenseStructureResponse> structures = transactionService.getExpenseStructure(null, month, year);
        List<TransactionResponse> topExpenses = transactionService.getHighestExpenses(null, month, year);

        // 2. LẤY THÊM TÓM TẮT LỊCH SỬ 6 THÁNG QUA
        List<BalanceTrendResponse> trends = transactionService.getBalanceTrend(null);

        // 3. ĐÓNG GÓI DATA
        StringBuilder contextBuilder = new StringBuilder();

        contextBuilder.append("--- TÓM TẮT XU HƯỚNG TÀI CHÍNH 6 THÁNG GẦN NHẤT ---\n");
        for (BalanceTrendResponse trend : trends) {
            contextBuilder.append(String.format("- Tháng %d/%d: Thu %s | Chi %s | Dư %s\n",
                    trend.getMonth(), trend.getYear(), trend.getIncome(), trend.getExpense(), trend.getNetSavings()));
        }
        contextBuilder.append("\n");

        contextBuilder.append("--- CHI TIẾT DỮ LIỆU THÁNG HIỆN TẠI (").append(month).append("/").append(year).append(") ---\n");
        contextBuilder.append("- Tổng thu: ").append(stats.getTotalIncome()).append("\n");
        contextBuilder.append("- Tổng chi: ").append(stats.getTotalExpense()).append("\n");
        contextBuilder.append("- Tiết kiệm: ").append(stats.getNetSavings()).append("\n\n");

        contextBuilder.append("--- CƠ CẤU CHI TIÊU THÁNG NÀY ---\n");
        for (ExpenseStructureResponse s : structures) {
            contextBuilder.append(String.format("- %s: %s (%.2f%%)\n", s.getCategoryName(), s.getAmount(), s.getPercentage()));
        }

        contextBuilder.append("\n--- TOP 5 KHOẢN CHI LỚN NHẤT THÁNG NÀY ---\n");
        for (TransactionResponse t : topExpenses) {
            String note = (t.getNote() != null && !t.getNote().isEmpty()) ? t.getNote() : "Không ghi chú";
            String dateStr = t.getDate().toString();
            String shortDate = dateStr.length() >= 10 ? dateStr.substring(0, 10) : dateStr;
            contextBuilder.append(String.format("- Ngày %s: %s (%s) - Danh mục: %s\n", shortDate, t.getAmount(), note, t.getCategoryName()));
        }

        // 4. LUẬT CHO AI
        String systemPrompt = """
                Bạn là chuyên gia tư vấn tài chính cá nhân.
                Dưới đây là Bối cảnh tài chính của người dùng (Gồm lịch sử 6 tháng và chi tiết tháng hiện tại).
                Hãy phân tích xu hướng, khen ngợi nếu họ tiết kiệm tốt, hoặc cảnh báo nếu tháng này tiêu lố hơn các tháng trước.
                
                QUY TẮC: Xưng "AI Cố Vấn" và gọi người dùng là "Sếp". Trả lời ngắn gọn, format Markdown đẹp mắt.
                
                BỐI CẢNH DỮ LIỆU:
                {context}
                """;

        String finalSystemPrompt = systemPrompt.replace("{context}", contextBuilder.toString());

        try {
            return chatClient.prompt()
                    .system(finalSystemPrompt)
                    .user(userMessage)
                    .advisors(MessageChatMemoryAdvisor.builder(chatMemory).build())
                    .advisors(a -> a
                            .param("chat_memory_conversation_id", currentUserId)
                            .param("chat_memory_retrieve_size", 10)
                    )
                    .call()
                    .content();
        } catch (Exception e) {
            log.error("Lỗi AI: {}", e.getMessage(), e);
            return "Xin lỗi sếp, hệ thống đang bận xíu!";
        }
    }
}