package com.fintrack.transaction_service.service;

import com.fintrack.transaction_service.dto.event.NotificationEvent;
import com.fintrack.transaction_service.dto.request.TransactionCreationRequest;
import com.fintrack.transaction_service.dto.request.WalletBalanceUpdateRequest;
import com.fintrack.transaction_service.dto.response.MonthlyStatisticsResponse;
import com.fintrack.transaction_service.dto.response.PageResponse;
import com.fintrack.transaction_service.dto.response.TransactionResponse;
import com.fintrack.transaction_service.entity.Category;
import com.fintrack.transaction_service.entity.Transaction;
import com.fintrack.transaction_service.enums.TransactionType;
import com.fintrack.transaction_service.exception.AppException;
import com.fintrack.transaction_service.exception.ErrorCode;
import com.fintrack.transaction_service.mapper.TransactionMapper;
import com.fintrack.transaction_service.repository.CategoryRepository;
import com.fintrack.transaction_service.repository.TransactionRepository;
import com.fintrack.transaction_service.repository.httpclient.IdentityClient;
import com.fintrack.transaction_service.repository.httpclient.WalletClient;
import com.fintrack.transaction_service.repository.specification.TransactionSpecification;
import com.fintrack.transaction_service.utils.ExcelHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionService {
    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final TransactionMapper transactionMapper;
    private final WalletClient walletClient;
    private final IdentityClient identityClient;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public ByteArrayInputStream exportToExcel(String walletId, TransactionType type, Instant startDate, Instant endDate) {
        // 1. Tạo bộ lọc (giống hệt hàm getTransactions nhưng không phân trang)
        Specification<Transaction> spec = Specification.where(TransactionSpecification.hasWalletId(walletId))
                .and(TransactionSpecification.hasType(type))
                .and(TransactionSpecification.createdBetween(startDate, endDate));

        // 2. Lấy toàn bộ dữ liệu (không phân trang - findAll(spec))
        // Lưu ý: Cần sort theo ngày giảm dần cho đẹp
        List<Transaction> transactions = transactionRepository.findAll(spec, Sort.by("date").descending());

        // 3. Gọi Helper để tạo file
        return ExcelHelper.transactionsToExcel(transactions);
    }

    public MonthlyStatisticsResponse getMonthlyStatistics(String walletId, int month, int year) {
        // 1. Tính toán khoảng thời gian (Start - End) của tháng
        // Lưu ý: Project đang dùng Instant (UTC), nên ta cần xử lý múi giờ cẩn thận.
        // Ở đây giả sử ta tính theo giờ hệ thống (hoặc UTC mặc định)
        YearMonth yearMonth = YearMonth.of(year, month);

        // Ngày đầu tháng lúc 00:00:00
        Instant start = yearMonth.atDay(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
        // Ngày cuối tháng lúc 23:59:59.999999
        Instant end = yearMonth.atEndOfMonth().atTime(23, 59, 59).atZone(ZoneId.systemDefault()).toInstant();

        // 2. Tính Tổng Thu (INCOME)
        BigDecimal totalIncome = transactionRepository.sumAmountByWalletAndTypeAndDateBetween(
                walletId, TransactionType.INCOME, start, end
        );

        // 3. Tính Tổng Chi (EXPENSE)
        // Lưu ý: Trong DB, EXPENSE đang lưu số ÂM (ví dụ -50000).
        // Khi hiển thị thống kê "Tổng chi tiêu", ta thường muốn hiện số dương (Chi tiêu: 50.000đ).
        // Nên ta lấy giá trị tuyệt đối (abs) hoặc đảo dấu.
        BigDecimal totalExpenseRaw = transactionRepository.sumAmountByWalletAndTypeAndDateBetween(
                walletId, TransactionType.EXPENSE, start, end
        );
        // Đổi sang số dương để hiển thị cho đẹp: "Chi tiêu: 50.000"
        BigDecimal totalExpense = totalExpenseRaw.abs();

        // 4. Tính Số Dư (Net Savings) = Thu + Chi (Vì Chi là số âm nên cộng vào là trừ ra)
        // Ví dụ: Thu 100 + (-30) = 70
        BigDecimal netSavings = totalIncome.add(totalExpenseRaw);

        return MonthlyStatisticsResponse.builder()
                .month(month)
                .year(year)
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .netSavings(netSavings)
                .build();
    }

    public PageResponse<TransactionResponse> getTransactions(
            int page, int size,
            String walletId, TransactionType type,
            Instant startDate, Instant endDate) {

        // 1. Tạo Pageable (Sắp xếp mới nhất lên đầu)
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("createdAt").descending());

        // 2. Tạo Specification (Dynamic Query)
        Specification<Transaction> spec = Specification.where(TransactionSpecification.hasWalletId(walletId))
                .and(TransactionSpecification.hasType(type))
                .and(TransactionSpecification.createdBetween(startDate, endDate));

        // 3. Gọi Repository
        Page<Transaction> pageData = transactionRepository.findAll(spec, pageable);

        // 4. Map sang Response
        return PageResponse.<TransactionResponse>builder()
                .currentPage(page)
                .pageSize(pageData.getSize())
                .totalPages(pageData.getTotalPages())
                .totalElements(pageData.getTotalElements())
                .data(pageData.getContent().stream().map(transactionMapper::toTransactionResponse).toList())
                .build();
    }

    @Transactional
    public TransactionResponse create(TransactionCreationRequest request) {
        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
        }

        // 1. Map và Lưu Transaction vào DB trước (Trạng thái Pending hoặc cứ lưu trước)
        Transaction transaction = transactionMapper.toTransaction(request);
        transaction.setCategory(category);
        transaction = transactionRepository.save(transaction); // Có ID rồi

        // 2. Tính toán tiền
        BigDecimal updateAmount = request.getAmount();
        if (request.getType() == TransactionType.EXPENSE) {
            updateAmount = updateAmount.negate();
        }

        // 3. Gọi sang Wallet
        // Nếu dòng này lỗi -> Exception -> Spring tự Rollback bước 1 (Xóa transaction khỏi DB) -> An toàn
        WalletBalanceUpdateRequest balanceRequest = WalletBalanceUpdateRequest.builder()
                .amount(updateAmount)
                .build();

        walletClient.updateBalance(request.getWalletId(), balanceRequest);

        // 4. Gửi Notification qua Kafka
        String recipientEmail = "user@gmail.com"; // Email mặc định phòng hờ
        String username = "Bạn"; // Tên mặc định phòng hờ

        try {
            // Gọi Identity Service (Token tự động được truyền theo nhờ Interceptor)
            var userResponse = identityClient.getMyInfo();
            if (userResponse != null && userResponse.getResult() != null) {
                recipientEmail = userResponse.getResult().getEmail();
                username = userResponse.getResult().getUsername();
            }
        } catch (Exception e) {
            // Nếu lỗi kết nối Identity, ta log lại và vẫn cho giao dịch thành công
            // (chỉ là không gửi mail được hoặc gửi sai)
            // Tốt nhất là dùng Circuit Breaker, nhưng tạm thời try-catch cho đơn giản.
            System.err.println("Không lấy được thông tin User từ Identity: " + e.getMessage());
        }

        // 1. Format số tiền (Ví dụ: 50000 -> 50.000)
        NumberFormat formatter = NumberFormat.getInstance(new java.util.Locale("vi", "VN"));
        String formattedNumber = formatter.format(transaction.getAmount());

        // 2. Xử lý dấu +/- và màu sắc (tạm thời text chưa màu)
        String amountString;
        String actionString;

        if (transaction.getType() == TransactionType.EXPENSE) {
            amountString = "-" + formattedNumber + " VND";
            actionString = "thanh toán cho";
        } else {
            amountString = "+" + formattedNumber + " VND";
            actionString = "nhận tiền từ";
        }

        // 3. Tạo nội dung body
        String emailBody = String.format(
                "Xin chào %s, \n\n Giao dịch mới: %s\n" +
                        "Nội dung: %s %s\n" +
                        "Thời gian: %s",
                username,
                amountString,
                actionString,
                (category != null ? category.getName() : "Không phân loại"),
                transaction.getDate().toString() // Hoặc format ngày đẹp hơn nếu muốn
        );

        // 4. Bắn Event
        NotificationEvent event = NotificationEvent.builder()
                .channel("EMAIL")
                .recipient(recipientEmail)
                .subject("Biến động số dư: " + amountString)
                .body(emailBody)
                .build();

        // Gửi và log kết quả
        kafkaTemplate.send("notification-delivery", event);

        // 4. Trả về kết quả
        return transactionMapper.toTransactionResponse(transaction);
    }
}
