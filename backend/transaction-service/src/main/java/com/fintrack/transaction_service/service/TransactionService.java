package com.fintrack.transaction_service.service;

import com.fintrack.transaction_service.dto.event.NotificationEvent;
import com.fintrack.transaction_service.dto.request.TransactionCreationRequest;
import com.fintrack.transaction_service.dto.request.TransactionUpdateRequest;
import com.fintrack.transaction_service.dto.request.WalletBalanceUpdateRequest;
import com.fintrack.transaction_service.dto.response.*;
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
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

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

    public long countTransactionsByWallet(String walletId) {
        return transactionRepository.countByWalletId(walletId);
    }

    public List<TransactionResponse> getHighestExpenses(String walletId, int month, int year) {
        YearMonth yearMonth = YearMonth.of(year, month);
        Instant start = yearMonth.atDay(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant end = yearMonth.atEndOfMonth().atTime(23, 59, 59).atZone(ZoneId.systemDefault()).toInstant();

        // Gọi hàm Query vừa viết
        List<Transaction> transactions = transactionRepository.findHighestExpenses(walletId, start, end);

        return transactions.stream()
                .map(transactionMapper::toTransactionResponse)
                .toList();
    }

    /**
     * Lấy xu hướng dòng tiền 6 tháng gần nhất (Balance Trend)
     */
    public List<BalanceTrendResponse> getBalanceTrend(String walletId) {
        List<BalanceTrendResponse> trends = new ArrayList<>();
        YearMonth currentMonth = YearMonth.now();

        // Lặp 6 lần cho 6 tháng gần nhất (từ quá khứ -> hiện tại)
        for (int i = 5; i >= 0; i--) {
            YearMonth targetMonth = currentMonth.minusMonths(i);

            // Tính ngày đầu tháng và cuối tháng
            Instant start = targetMonth.atDay(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
            Instant end = targetMonth.atEndOfMonth().atTime(23, 59, 59).atZone(ZoneId.systemDefault()).toInstant();

            // Gọi Repo tính tổng (Repo đã xử lý walletId null)
            BigDecimal income = transactionRepository.sumAmountByWalletIdAndTypeAndDate(
                    walletId, TransactionType.INCOME, start, end
            );

            BigDecimal expenseRaw = transactionRepository.sumAmountByWalletIdAndTypeAndDate(
                    walletId, TransactionType.EXPENSE, start, end
            );
            BigDecimal expense = expenseRaw.abs(); // Chuyển số âm thành dương

            trends.add(BalanceTrendResponse.builder()
                    .month(targetMonth.getMonthValue())
                    .year(targetMonth.getYear())
                    .income(income)
                    .expense(expense)
                    .netSavings(income.subtract(expense)) // Thu - Chi
                    .build());
        }
        return trends;
    }

    /**
     * Lấy cơ cấu chi tiêu theo danh mục (Expense Structure)
     */
    public List<ExpenseStructureResponse> getExpenseStructure(String walletId, int month, int year) {
        // 1. Xác định thời gian
        YearMonth yearMonth = YearMonth.of(year, month);
        Instant start = yearMonth.atDay(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant end = yearMonth.atEndOfMonth().atTime(23, 59, 59).atZone(ZoneId.systemDefault()).toInstant();

        // 2. Lấy dữ liệu gom nhóm từ DB
        List<Object[]> rawData = transactionRepository.findExpenseStructure(walletId, start, end);

        // 3. Tính tổng chi tiêu (để chia phần trăm)
        BigDecimal totalExpense = rawData.stream()
                .map(obj -> (BigDecimal) obj[1])
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .abs();

        List<ExpenseStructureResponse> result = new ArrayList<>();

        // 4. Map sang DTO và tính %
        for (Object[] row : rawData) {
            Category category = (Category) row[0];
            BigDecimal amountRaw = (BigDecimal) row[1];
            BigDecimal amount = amountRaw.abs();

            double percentage = 0;
            if (totalExpense.compareTo(BigDecimal.ZERO) > 0) {
                percentage = amount.divide(totalExpense, 4, RoundingMode.HALF_UP).doubleValue() * 100;
            }

            result.add(ExpenseStructureResponse.builder()
                    .categoryId(category != null ? category.getId() : "uncategorized")
                    .categoryName(category != null ? category.getName() : "Khác")
                    .amount(amount)
                    .percentage(percentage)
                    .build());
        }

        // Sắp xếp giảm dần theo số tiền
        result.sort((a, b) -> b.getAmount().compareTo(a.getAmount()));

        return result;
    }

    /**
     * Hàm này dành riêng cho việc điều chỉnh số dư từ Wallet Service
     * QUAN TRỌNG: Wallet Service đã cập nhật số dư rồi, đây chỉ là ghi lại lịch sử
     */
    @Transactional
    public void createAdjustmentTransaction(TransactionCreationRequest request) {
        log.info("Tạo adjustment transaction: walletId={}, amount={}, type={}",
                request.getWalletId(), request.getAmount(), request.getType());

        // 1. Tìm hoặc tạo Category "Điều chỉnh số dư" (System Category)
        // Sử dụng synchronized để tránh duplicate khi nhiều request đồng thời
        Category category = getOrCreateSystemCategory("Điều chỉnh số dư", request.getType());

        // 2. Map và Lưu Transaction
        Transaction transaction = transactionMapper.toTransaction(request);
        transaction.setCategory(category);

        // Đảm bảo có note rõ ràng
        if (transaction.getNote() == null || transaction.getNote().isEmpty()) {
            transaction.setNote("Điều chỉnh số dư thủ công");
        }

        transaction = transactionRepository.save(transaction);
        log.info("Đã lưu adjustment transaction: id={}", transaction.getId());

        // 3. Gửi thông báo ASYNC (Không block transaction)
        sendTransactionNotification(transaction, category);
    }

    /**
     * Helper method: Tìm hoặc tạo System Category (UserId = null)
     * synchronized: Để tạm thời tránh race condition khi chạy 1 instance
     */
    private synchronized Category getOrCreateSystemCategory(String name, TransactionType type) {
        return categoryRepository.findByNameAndTypeAndUserIdIsNull(name, type)
                .orElseGet(() -> {
                    Category newCat = Category.builder()
                            .name(name)
                            .type(type)
                            .userId(null)
                            .description("Danh mục hệ thống tự động tạo")
                            .build();

                    log.info("Khởi tạo System Category mới: {} - {}", name, type);
                    return categoryRepository.save(newCat);
                });
    }

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
        BigDecimal totalIncome = transactionRepository.sumAmountByWalletIdAndTypeAndDate(
                walletId, TransactionType.INCOME, start, end
        );

        // 3. Tính Tổng Chi (EXPENSE)
        // Lưu ý: Trong DB, EXPENSE đang lưu số ÂM (ví dụ -50000).
        // Khi hiển thị thống kê "Tổng chi tiêu", ta thường muốn hiện số dương (Chi tiêu: 50.000đ).
        // Nên ta lấy giá trị tuyệt đối (abs) hoặc đảo dấu.
        BigDecimal totalExpenseRaw = transactionRepository.sumAmountByWalletIdAndTypeAndDate(
                walletId, TransactionType.EXPENSE, start, end
        );
        // Đổi sang số dương để hiển thị cho đẹp: "Chi tiêu: 50.000"
        BigDecimal totalExpense = totalExpenseRaw.abs();

        // 4. Tính Số Dư (Net Savings) = Thu + Chi (Vì Chi là số âm nên cộng vào là trừ ra)
        // Ví dụ: Thu 100 + (-30) = 70
        // do expense lưu trong db là số dương nên dùng subtract
        BigDecimal netSavings = totalIncome.subtract(totalExpenseRaw);

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
            Instant startDate, Instant endDate, String categoryId) {

        // 1. Tạo Pageable (Sắp xếp mới nhất lên đầu)
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("createdAt").descending());

        List<String> categoryIdsToFilter = null;
        if (categoryId != null) {
            Category category = categoryRepository.findById(categoryId).orElse(null);
            if (category != null) {
                categoryIdsToFilter = new ArrayList<>();
                // Tái sử dụng hàm đệ quy collectCategoryIds bạn đã viết ở hàm delete
                collectCategoryIds(category, categoryIdsToFilter);
            } else {
                // Nếu gửi ID tào lao lên thì cho list rỗng để không ra kết quả nào
                categoryIdsToFilter = List.of("non-existent-id");
            }
        }

        // 2. Tạo Specification (Dynamic Query)
        Specification<Transaction> spec = Specification.where(TransactionSpecification.hasWalletId(walletId))
                .and(TransactionSpecification.hasType(type))
                .and(TransactionSpecification.createdBetween(startDate, endDate))
                .and(TransactionSpecification.hasCategoryIn(categoryIdsToFilter));

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

    private void collectCategoryIds(Category category, List<String> ids) {
        ids.add(category.getId());
        if (category.getSubCategories() != null) {
            for (Category child : category.getSubCategories()) {
                collectCategoryIds(child, ids);
            }
        }
    }

    public TransactionResponse getTransaction(String id) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.TRANSACTION_NOT_FOUND));
        return transactionMapper.toTransactionResponse(transaction);
    }

    @Transactional
    public TransactionResponse update(String id, TransactionUpdateRequest request) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.TRANSACTION_NOT_FOUND));

        // 1. HOÀN TÁC SỐ DƯ CŨ TRÊN VÍ (Revert Old Balance)
        // Nếu là EXPENSE (Chi): Cũ là -100k -> Giờ phải +100k để bù lại
        // Nếu là INCOME (Thu): Cũ là +100k -> Giờ phải -100k để bù lại
        BigDecimal revertAmount = transaction.getAmount();
        if (transaction.getType() == TransactionType.INCOME) {
            revertAmount = revertAmount.negate(); // Đảo dấu thành âm để trừ đi
        }
        // Nếu là Expense thì revertAmount giữ nguyên dương (để cộng bù vào)

        // Gọi Wallet Service để hoàn tiền cũ
        walletClient.updateBalance(transaction.getWalletId(),
                WalletBalanceUpdateRequest.builder().amount(revertAmount).build());

        // 2. CẬP NHẬT THÔNG TIN MỚI
        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
            transaction.setCategory(category);
        }
        if (request.getAmount() != null) transaction.setAmount(request.getAmount());
        if (request.getNote() != null) transaction.setNote(request.getNote());
        if (request.getDate() != null) transaction.setDate(request.getDate());

        // Lưu tạm để lấy data mới nhất
        transaction = transactionRepository.save(transaction);

        // 3. ÁP DỤNG SỐ DƯ MỚI VÀO VÍ (Apply New Balance)
        BigDecimal newUpdateAmount = transaction.getAmount();
        if (transaction.getType() == TransactionType.EXPENSE) {
            newUpdateAmount = newUpdateAmount.negate(); // Chi tiêu thì trừ tiền
        }

        walletClient.updateBalance(transaction.getWalletId(),
                WalletBalanceUpdateRequest.builder().amount(newUpdateAmount).build());

        return transactionMapper.toTransactionResponse(transaction);
    }

    @Transactional
    public void delete(String id) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.TRANSACTION_NOT_FOUND));

        // 1. HOÀN TÁC SỐ DƯ (Trả lại tiền cho ví trước khi xóa)
        BigDecimal revertAmount = transaction.getAmount();
        if (transaction.getType() == TransactionType.INCOME) {
            revertAmount = revertAmount.negate();
        }
        // Gọi Wallet Service
        walletClient.updateBalance(transaction.getWalletId(),
                WalletBalanceUpdateRequest.builder().amount(revertAmount).build());

        // 2. XÓA MỀM (Soft Delete)
        transaction.setDeleted(true);
        transactionRepository.save(transaction);

        log.info("Đã xóa giao dịch {} và hoàn tiền lại ví {}", id, transaction.getWalletId());
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
        sendTransactionNotification(transaction, category);

        // 4. Trả về kết quả
        return transactionMapper.toTransactionResponse(transaction);
    }

    /**
     * Gửi notification về giao dịch qua Kafka (ASYNC)
     * Nếu lỗi sẽ không ảnh hưởng đến giao dịch chính
     */
    @Async
    public void sendTransactionNotification(Transaction transaction, Category category) {
        try {
            String recipientEmail = null;
            String username = "Người dùng";

            // Lấy thông tin user từ Identity Service
            try {
                var userResponse = identityClient.getMyInfo();
                if (userResponse != null && userResponse.getResult() != null) {
                    recipientEmail = userResponse.getResult().getEmail();
                    username = userResponse.getResult().getUsername();

                    if (recipientEmail == null || recipientEmail.isEmpty()) {
                        log.warn("User không có email, bỏ qua gửi thông báo cho transaction: {}", transaction.getId());
                        return;
                    }
                }
            } catch (Exception e) {
                log.error("Không lấy được thông tin User từ Identity Service: {}", e.getMessage());
                // Không gửi email nếu không lấy được thông tin user
                return;
            }

            // Format số tiền
            NumberFormat formatter = NumberFormat.getInstance(Locale.of("vi", "VN"));
            String formattedNumber = formatter.format(transaction.getAmount().abs());

            // Xử lý nội dung text
            String amountString;
            String actionString;

            if (transaction.getType() == TransactionType.EXPENSE) {
                amountString = "-" + formattedNumber + " VND";
                actionString = "thanh toán cho";
            } else {
                amountString = "+" + formattedNumber + " VND";
                actionString = "nhận tiền từ";
            }

            String categoryName = (category != null) ? category.getName() : "Không phân loại";

            // Tạo nội dung email
            String emailBody = String.format(
                    "Xin chào %s,\n\n" +
                    "Giao dịch mới: %s\n" +
                    "Nội dung: %s %s\n" +
                    "Ghi chú: %s\n" +
                    "Thời gian: %s\n\n" +
                    "Đây là email tự động, vui lòng không trả lời.",
                    username,
                    amountString,
                    actionString,
                    categoryName,
                    transaction.getNote() != null ? transaction.getNote() : "Không có",
                    transaction.getDate().toString()
            );

            // Tạo và gửi event
            NotificationEvent event = NotificationEvent.builder()
                    .channel("EMAIL")
                    .recipient(recipientEmail)
                    .subject("Biến động số dư: " + amountString)
                    .body(emailBody)
                    .build();

            kafkaTemplate.send("notification-delivery", event);
            log.info("Đã gửi notification event cho transaction: {}", transaction.getId());

        } catch (Exception e) {
            log.error("Lỗi khi gửi Kafka Notification cho transaction {}: {}",
                    transaction.getId(), e.getMessage(), e);
        }
    }
}
