package com.fintrack.transaction_service.service.ai;

import com.fintrack.transaction_service.dto.response.AiReceiptResponse;
import com.fintrack.transaction_service.entity.Category;
import com.fintrack.transaction_service.exception.AppException;
import com.fintrack.transaction_service.exception.ErrorCode;
import com.fintrack.transaction_service.repository.CategoryRepository;
import com.fintrack.transaction_service.utils.SecurityUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.content.Media;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;
import org.springframework.util.MimeTypeUtils;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class AiAssistantService {

    private final ChatClient chatClient;
    private final CategoryRepository categoryRepository;

    public AiAssistantService(ChatClient.Builder chatClientBuilder, CategoryRepository categoryRepository) {
        this.chatClient = chatClientBuilder.build();
        this.categoryRepository = categoryRepository;
    }

    public AiReceiptResponse scanReceipt(MultipartFile file, String textNote) {
        String userId = SecurityUtils.getCurrentUserId();
        LocalDate today = LocalDate.now();

        List<Category> userCategories = categoryRepository.findByUserIdOrUserIdIsNull(userId);

        String categoriesContext = userCategories.stream()
                .map(c -> String.format("- ID: %s | Tên: %s | Loại: %s", c.getId(), c.getName(), c.getType()))
                .collect(Collectors.joining("\n"));

        String systemPrompt = """
                Bạn là một trợ lý tài chính cá nhân thông minh.
                Hôm nay là ngày: {today}. Hãy dùng mốc thời gian này để tính toán chuẩn xác các từ chỉ thời gian tương đối (ví dụ: "hôm nay", "hôm qua", "hôm kia", "tuần trước").
                
                Nhiệm vụ của bạn là trích xuất thông tin giao dịch từ hình ảnh hóa đơn hoặc văn bản người dùng cung cấp.
                
                Dưới đây là danh sách các danh mục (Category) hiện có của người dùng:
                {categories}
                
                Hãy trích xuất và phân tích theo các quy tắc sau:
                1. amount: Số tiền thanh toán cuối cùng (kiểu số, không chứa dấu phẩy hay ký tự tiền tệ).
                2. date: Ngày giao dịch (định dạng YYYY-MM-DD). Nếu người dùng dùng từ tương đối, hãy tự động cộng/trừ ngày dựa vào mốc {today}. Nếu không tìm thấy bất kỳ thông tin nào về thời gian, mặc định lấy {today}.
                3. note: Ghi chú ngắn gọn về giao dịch (ví dụ: "Highland Coffee", "Đi siêu thị", "Nhận lương", "Mẹ cho").
                4. type: Phân tích ngữ cảnh. Trả về "INCOME" nếu đây là khoản thu (nhận lương, được cho, hoàn tiền...). Trả về "EXPENSE" nếu là khoản chi (mua sắm, hóa đơn, trả tiền...). Mặc định là "EXPENSE".
                5. categoryId: Phân tích 'note' và chọn ra ID của danh mục phù hợp nhất từ danh sách phía trên. Chú ý phải chọn danh mục có 'Loại' (type) khớp với trường 'type' bạn vừa xác định ở quy tắc 4. Nếu không chắc chắn, trả về null.
                6. currency: Nhận diện mã tiền tệ. Nếu có ký hiệu $ thì là USD. Nếu không rõ, trả về VND.
                """;

        String finalSystemPrompt = systemPrompt
                .replace("{categories}", categoriesContext)
                .replace("{today}", today.toString());
        String userMessage = (textNote != null && !textNote.trim().isEmpty()) ? textNote : "Hãy phân tích hóa đơn này.";

        try {
            var promptBuilder = chatClient.prompt()
                    .system(finalSystemPrompt)
                    .user(userMessage);

            if (file != null && !file.isEmpty()) {
                Media media = new Media(
                        MimeTypeUtils.parseMimeType(file.getContentType()),
                        new ByteArrayResource(file.getBytes())
                );

                promptBuilder = chatClient.prompt()
                        .system(finalSystemPrompt)
                        .user(u -> u.text(userMessage).media(media));
            }

            return promptBuilder.call().entity(AiReceiptResponse.class);

        } catch (Exception e) {
            log.error("Lỗi khi gọi Gemini AI: {}", e.getMessage(), e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }
}