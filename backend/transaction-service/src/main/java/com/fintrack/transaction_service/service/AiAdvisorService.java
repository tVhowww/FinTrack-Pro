package com.fintrack.transaction_service.service;

import com.fintrack.transaction_service.configuration.AiToolConfig;
import com.fintrack.transaction_service.utils.SecurityUtils;
import com.fintrack.transaction_service.utils.SimpleChatMemory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@Slf4j
public class AiAdvisorService {
    private final ChatClient chatClient;
    private final ChatMemory chatMemory;
    private final AiToolConfig aiToolConfig;

    public AiAdvisorService(ChatClient.Builder chatClientBuilder, AiToolConfig aiToolConfig) {
        this.chatClient = chatClientBuilder.build();
        this.chatMemory = new SimpleChatMemory();
        this.aiToolConfig = aiToolConfig;
    }

    public String chatWithAdvisor(String userMessage) {
        String currentUserId = SecurityUtils.getCurrentUserId();

        // Mớm cho nó ngày hiện tại để nó có khái niệm về thời gian thực
        LocalDate now = LocalDate.now();

        String systemPrompt = """
                Bạn là chuyên gia tư vấn tài chính cá nhân. Hôm nay là ngày {today}.
                
                QUY TẮC TỐI THƯỢNG CỦA BẠN (BẮT BUỘC PHẢI TUÂN THỦ):
                1. Xưng "AI Cố Vấn" và gọi người dùng là "Sếp".
                2. Khi người dùng hỏi về tình hình thu chi, BẮT BUỘC phải TỰ ĐỘNG GỌI TOOL để tra cứu dữ liệu. Nếu không nói rõ thời gian, tự động tra cứu tháng hiện tại.
                3. TUYỆT ĐỐI KHÔNG ĐƯỢC thông báo trước ý định tra cứu (Ví dụ cấm nói: "Tôi sẽ tra cứu", "Đợi tôi một chút"). 
                4. Bạn PHẢI gọi Tool ngầm ở hậu cảnh, sau khi có kết quả từ Tool thì mới được chat trả lời thẳng kết quả cuối cùng cho người dùng trong 1 lần duy nhất.
                """;

        String finalSystemPrompt = systemPrompt.replace("{today}", now.toString());

        try {
            return chatClient.prompt()
                    .system(finalSystemPrompt)
                    .user(userMessage)
                    .tools(aiToolConfig)
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