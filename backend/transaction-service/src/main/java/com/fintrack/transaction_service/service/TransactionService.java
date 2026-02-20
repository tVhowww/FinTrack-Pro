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
import com.fintrack.transaction_service.utils.SecurityUtils;
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
import java.util.Collections;
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
    private final CurrencyConverterService currencyConverterService;


    public long countTransactionsByWallet(String walletId) {
        return transactionRepository.countByWalletId(walletId);
    }

    // Thêm hàm này vào TransactionService.java
    public BigDecimal getTotalBalance() {
        // 1. Lấy đồng tiền cơ sở của User
        String baseCurrency = getUserBaseCurrency();
        BigDecimal totalBalance = BigDecimal.ZERO;

        try {
            // 2. Lấy danh sách ví từ Wallet Service
            var response = walletClient.getMyWallets();
            if (response != null && response.getResult() != null) {
                for (var wallet : response.getResult()) {
                    // 3. Quy đổi số dư từng ví ra đồng tiền cơ sở
                    BigDecimal converted = currencyConverterService.convertCurrency(
                            wallet.getBalance(),
                            wallet.getCurrency(),
                            baseCurrency
                    );
                    totalBalance = totalBalance.add(converted);
                }
            }
        } catch (Exception e) {
            log.error("Lỗi khi lấy danh sách ví để tính tổng số dư: {}", e.getMessage());
        }

        return totalBalance;
    }

    public List<TransactionResponse> getHighestExpenses(String walletId, int month, int year) {
        List<String> walletIds = resolveWalletIds(walletId);
        if (walletIds.isEmpty()) return new ArrayList<>();

        YearMonth yearMonth = YearMonth.of(year, month);
        Instant start = yearMonth.atDay(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant end = yearMonth.atEndOfMonth().atTime(23, 59, 59).atZone(ZoneId.systemDefault()).toInstant();

        List<Transaction> transactions = transactionRepository.findHighestExpensesByWalletIds(walletIds, start, end);

        return transactions.stream()
                .map(transactionMapper::toTransactionResponse)
                .toList();
    }

    /**
     * Lấy xu hướng dòng tiền 6 tháng gần nhất (Balance Trend)
     */
    public List<BalanceTrendResponse> getBalanceTrend(String walletId) {
        List<String> walletIds = resolveWalletIds(walletId);
        if (walletIds.isEmpty()) return new ArrayList<>();

        String baseCurrency = getUserBaseCurrency();
        java.util.Map<String, String> walletCurrencyMap = getWalletCurrencyMap();
        List<BalanceTrendResponse> trends = new ArrayList<>();
        YearMonth currentMonth = YearMonth.now();

        for (int i = 5; i >= 0; i--) {
            YearMonth targetMonth = currentMonth.minusMonths(i);
            Instant start = targetMonth.atDay(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
            Instant end = targetMonth.atEndOfMonth().atTime(23, 59, 59).atZone(ZoneId.systemDefault()).toInstant();

            Specification<Transaction> spec = Specification.where(TransactionSpecification.hasWalletIdIn(walletIds))
                    .and(TransactionSpecification.createdBetween(start, end));
            List<Transaction> transactions = transactionRepository.findAll(spec);

            BigDecimal mIncome = BigDecimal.ZERO;
            BigDecimal mExpense = BigDecimal.ZERO;

            for (Transaction tx : transactions) {
                String txCurrency = walletCurrencyMap.getOrDefault(tx.getWalletId(), "VND");
                BigDecimal converted = currencyConverterService.convertCurrency(tx.getAmount().abs(), txCurrency, baseCurrency);

                if (tx.getType() == TransactionType.INCOME) {
                    mIncome = mIncome.add(converted);
                } else if (tx.getType() == TransactionType.EXPENSE) {
                    mExpense = mExpense.add(converted);
                }
            }

            trends.add(BalanceTrendResponse.builder()
                    .month(targetMonth.getMonthValue())
                    .year(targetMonth.getYear())
                    .income(mIncome)
                    .expense(mExpense)
                    .netSavings(mIncome.subtract(mExpense))
                    .build());
        }
        return trends;
    }

    /**
     * Lấy cơ cấu chi tiêu theo danh mục (Expense Structure)
     */
    public List<ExpenseStructureResponse> getExpenseStructure(String walletId, int month, int year) {
        List<String> walletIds = resolveWalletIds(walletId);
        if (walletIds.isEmpty()) return new ArrayList<>();

        String baseCurrency = getUserBaseCurrency();
        java.util.Map<String, String> walletCurrencyMap = getWalletCurrencyMap();

        YearMonth yearMonth = YearMonth.of(year, month);
        Instant start = yearMonth.atDay(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant end = yearMonth.atEndOfMonth().atTime(23, 59, 59).atZone(ZoneId.systemDefault()).toInstant();

        // Chỉ lấy giao dịch CHI TIÊU
        Specification<Transaction> spec = Specification.where(TransactionSpecification.hasWalletIdIn(walletIds))
                .and(TransactionSpecification.hasType(TransactionType.EXPENSE))
                .and(TransactionSpecification.createdBetween(start, end));

        List<Transaction> transactions = transactionRepository.findAll(spec);

        // Map để gom nhóm số tiền theo CategoryId
        java.util.Map<Category, BigDecimal> categorySums = new java.util.HashMap<>();
        BigDecimal totalConvertedExpense = BigDecimal.ZERO;

        for (Transaction tx : transactions) {
            String txCurrency = walletCurrencyMap.getOrDefault(tx.getWalletId(), "VND");
            BigDecimal converted = currencyConverterService.convertCurrency(tx.getAmount().abs(), txCurrency, baseCurrency);

            totalConvertedExpense = totalConvertedExpense.add(converted);

            // Gom nhóm
            Category cat = tx.getCategory();
            categorySums.put(cat, categorySums.getOrDefault(cat, BigDecimal.ZERO).add(converted));
        }

        List<ExpenseStructureResponse> result = new ArrayList<>();
        for (java.util.Map.Entry<Category, BigDecimal> entry : categorySums.entrySet()) {
            Category category = entry.getKey();
            BigDecimal amount = entry.getValue();

            double percentage = 0;
            if (totalConvertedExpense.compareTo(BigDecimal.ZERO) > 0) {
                percentage = amount.divide(totalConvertedExpense, 4, RoundingMode.HALF_UP).doubleValue() * 100;
            }

            result.add(ExpenseStructureResponse.builder()
                    .categoryId(category != null ? category.getId() : "uncategorized")
                    .categoryName(category != null ? category.getName() : "Khác")
                    .amount(amount)
                    .percentage(percentage)
                    .build());
        }

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

        Category category = getOrCreateSystemCategory("Điều chỉnh số dư", request.getType());

        Transaction transaction = transactionMapper.toTransaction(request);
        transaction.setCategory(category);

        if (transaction.getNote() == null || transaction.getNote().isEmpty()) {
            transaction.setNote("Điều chỉnh số dư thủ công");
        }

        transaction = transactionRepository.save(transaction);
        log.info("Đã lưu adjustment transaction: id={}", transaction.getId());

        // LẤY INFO TRƯỚC KHI XUỐNG ASYNC
        String recipientEmail = null;
        String username = "Người dùng";
        try {
            var userResponse = identityClient.getMyInfo();
            if (userResponse != null && userResponse.getResult() != null) {
                recipientEmail = userResponse.getResult().getEmail();
                username = userResponse.getResult().getUsername();
            }
        } catch (Exception e) {
            log.error("Lỗi lấy thông tin user để gửi email: {}", e.getMessage());
        }

        // 3. Gửi thông báo ASYNC (Truyền thêm Email và Tên)
        sendTransactionNotification(transaction, category, recipientEmail, username);
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
        validateWalletOwnership(walletId);

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
        List<String> walletIds = resolveWalletIds(walletId);
        if (walletIds.isEmpty()) {
            return MonthlyStatisticsResponse.builder()
                    .month(month).year(year)
                    .totalIncome(BigDecimal.ZERO).totalExpense(BigDecimal.ZERO).netSavings(BigDecimal.ZERO).build();
        }

        // 1. Chuẩn bị dữ liệu quy đổi
        String baseCurrency = getUserBaseCurrency();
        java.util.Map<String, String> walletCurrencyMap = getWalletCurrencyMap();

        YearMonth yearMonth = YearMonth.of(year, month);
        Instant start = yearMonth.atDay(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant end = yearMonth.atEndOfMonth().atTime(23, 59, 59).atZone(ZoneId.systemDefault()).toInstant();

        // 2. Lấy toàn bộ giao dịch trong tháng của các ví này
        Specification<Transaction> spec = Specification.where(TransactionSpecification.hasWalletIdIn(walletIds))
                .and(TransactionSpecification.createdBetween(start, end));
        List<Transaction> transactions = transactionRepository.findAll(spec);

        // 3. Tính toán trên RAM (Java)
        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpense = BigDecimal.ZERO;

        for (Transaction tx : transactions) {
            // Xác định đồng tiền của cái ví chứa giao dịch này
            String txCurrency = walletCurrencyMap.getOrDefault(tx.getWalletId(), "VND");

            // QUY ĐỔI TIỀN TỆ
            BigDecimal convertedAmount = currencyConverterService.convertCurrency(
                    tx.getAmount().abs(), txCurrency, baseCurrency);

            if (tx.getType() == TransactionType.INCOME) {
                totalIncome = totalIncome.add(convertedAmount);
            } else if (tx.getType() == TransactionType.EXPENSE) {
                totalExpense = totalExpense.add(convertedAmount);
            }
        }

        return MonthlyStatisticsResponse.builder()
                .month(month).year(year)
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .netSavings(totalIncome.subtract(totalExpense))
                .build();
    }

    public PageResponse<TransactionResponse> getTransactions(
            int page, int size,
            String walletId, TransactionType type,
            Instant startDate, Instant endDate, String categoryId) {

        // Lấy UserID hiện tại
        String currentUserId = SecurityUtils.getCurrentUserId();
        List<String> walletIdsToQuery = new ArrayList<>();

        // LOGIC MỚI: Xử lý Wallet ID
        if (walletId != null && !walletId.trim().isEmpty() && !"undefined".equals(walletId)) {
            // Trường hợp 1: Có chọn ví cụ thể -> Check quyền sở hữu ví đó
            validateWalletOwnership(walletId);
            walletIdsToQuery.add(walletId);
        } else {
            // Trường hợp 2: Không chọn ví (Xem tất cả) -> Lấy danh sách ví của User này
            // Gọi sang Wallet Service lấy "My Wallets"
            var walletResponse = walletClient.getMyWallets(); // Cần đảm bảo WalletClient có hàm này (xem Bước 3)
            if (walletResponse != null && walletResponse.getResult() != null) {
                walletIdsToQuery = walletResponse.getResult().stream()
                        .map(WalletResponse::getId)
                        .toList();
            }
            // Nếu user không có ví nào thì trả về rỗng luôn
            if (walletIdsToQuery.isEmpty()) {
                return PageResponse.<TransactionResponse>builder()
                        .currentPage(page).pageSize(size).totalElements(0).data(List.of()).build();
            }
        }

        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("createdAt").descending());

        // Xử lý Category (giữ nguyên)
        List<String> categoryIdsToFilter = null;
        if (categoryId != null) {
            Category category = categoryRepository.findById(categoryId).orElse(null);
            if (category != null) {
                categoryIdsToFilter = new ArrayList<>();
                collectCategoryIds(category, categoryIdsToFilter);
            } else {
                categoryIdsToFilter = List.of("non-existent-id");
            }
        }

        // Tạo Specification: Thay hasWalletId bằng hasWalletIdIn
        Specification<Transaction> spec = Specification.where(TransactionSpecification.hasWalletIdIn(walletIdsToQuery))
                .and(TransactionSpecification.hasType(type))
                .and(TransactionSpecification.createdBetween(startDate, endDate))
                .and(TransactionSpecification.hasCategoryIn(categoryIdsToFilter));

        Page<Transaction> pageData = transactionRepository.findAll(spec, pageable);

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

        // Kiểm tra quyền sở hữu wallet của transaction này
        validateWalletOwnership(transaction.getWalletId());

        return transactionMapper.toTransactionResponse(transaction);
    }


    private void validateWalletOwnership(String walletId) {
        // Nếu null hoặc rỗng thì bỏ qua (để hàm gọi bên ngoài tự xử lý logic "All Wallets")
        if (walletId == null || walletId.trim().isEmpty() || "undefined".equals(walletId)) {
            return;
        }

        String currentUserId = SecurityUtils.getCurrentUserId();

        try {
            var response = walletClient.getWallet(walletId);
            if (response == null || response.getResult() == null) {
                throw new AppException(ErrorCode.WALLET_NOT_FOUND);
            }

            // Debug log: In ra để kiểm tra xem userId có bị null không
            log.info("Check wallet {} owner: {} vs current user: {}",
                    walletId, response.getResult().getUserId(), currentUserId);

            if (!currentUserId.equals(response.getResult().getUserId())) {
                throw new AppException(ErrorCode.UNAUTHORIZED);
            }
        } catch (Exception e) {
            // Nếu Wallet Service báo lỗi 404 hoặc 500
            log.error("Lỗi xác thực ví: {}", e.getMessage());
            throw new AppException(ErrorCode.WALLET_NOT_FOUND);
        }
    }

    private List<String> resolveWalletIds(String walletId) {
        if (walletId != null && !walletId.trim().isEmpty() && !"undefined".equals(walletId)) {
            // Case 1: Người dùng chọn 1 ví cụ thể
            validateWalletOwnership(walletId); // Check xem ví này có phải của nó không
            return List.of(walletId);
        } else {
            // Case 2: Xem tổng quan (Không gửi ID)
            // Phải gọi sang Wallet Service để hỏi: "Thằng này có những ví nào?"
            try {
                var response = walletClient.getMyWallets();
                if (response != null && response.getResult() != null) {
                    List<String> ids = response.getResult().stream()
                            .map(WalletResponse::getId)
                            .toList();

                    // Nếu user mới tạo chưa có ví nào -> Trả về list rỗng
                    if (ids.isEmpty()) return Collections.emptyList();

                    return ids;
                }
            } catch (Exception e) {
                log.error("Lỗi khi lấy danh sách ví: {}", e.getMessage());
            }
            return Collections.emptyList();
        }
    }

    @Transactional
    public TransactionResponse update(String id, TransactionUpdateRequest request) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.TRANSACTION_NOT_FOUND));

        validateWalletOwnership(transaction.getWalletId());

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

        validateWalletOwnership(transaction.getWalletId());

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
        validateWalletOwnership(request.getWalletId());

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
        }

        Transaction transaction = transactionMapper.toTransaction(request);
        transaction.setCategory(category);
        transaction = transactionRepository.save(transaction);

        BigDecimal updateAmount = request.getAmount();
        if (request.getType() == TransactionType.EXPENSE) {
            updateAmount = updateAmount.negate();
        }

        WalletBalanceUpdateRequest balanceRequest = WalletBalanceUpdateRequest.builder()
                .amount(updateAmount)
                .build();

        walletClient.updateBalance(request.getWalletId(), balanceRequest);

        // LẤY INFO TRƯỚC KHI XUỐNG ASYNC
        String recipientEmail = null;
        String username = "Người dùng";
        try {
            var userResponse = identityClient.getMyInfo();
            if (userResponse != null && userResponse.getResult() != null) {
                recipientEmail = userResponse.getResult().getEmail();
                username = userResponse.getResult().getUsername();
            }
        } catch (Exception e) {
            log.error("Lỗi lấy thông tin user để gửi email: {}", e.getMessage());
        }

        // 4. Gửi Notification qua Kafka (Truyền thêm Email và Tên)
        sendTransactionNotification(transaction, category, recipientEmail, username);

        return transactionMapper.toTransactionResponse(transaction);
    }

    /**
     * Gửi notification về giao dịch qua Kafka (ASYNC)
     * Nếu lỗi sẽ không ảnh hưởng đến giao dịch chính
     */
    @Async
    public void sendTransactionNotification(Transaction transaction, Category category, String recipientEmail, String username) { // 👇 ĐÃ THÊM THAM SỐ
        try {
            if (recipientEmail == null || recipientEmail.isEmpty()) {
                log.warn("User không có email, bỏ qua gửi thông báo cho transaction: {}", transaction.getId());
                return;
            }

            NumberFormat formatter = NumberFormat.getInstance(Locale.of("vi", "VN"));
            String formattedNumber = formatter.format(transaction.getAmount().abs());

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

    // Lấy đồng tiền cơ sở của User (nếu không có mặc định là VND)
    private String getUserBaseCurrency() {
        try {
            var userResponse = identityClient.getMyInfo();
            if (userResponse != null && userResponse.getResult() != null && userResponse.getResult().getBaseCurrency() != null) {
                return userResponse.getResult().getBaseCurrency();
            }
        } catch (Exception e) {
            log.error("Không lấy được Base Currency của User, dùng mặc định VND", e);
        }
        return "VND";
    }

    // Lấy Map chứa WalletId -> Currency (Ví dụ: "wallet-1" -> "USD")
    private java.util.Map<String, String> getWalletCurrencyMap() {
        java.util.Map<String, String> map = new java.util.HashMap<>();
        try {
            var response = walletClient.getMyWallets();
            if (response != null && response.getResult() != null) {
                for (var w : response.getResult()) {
                    map.put(w.getId(), w.getCurrency());
                }
            }
        } catch (Exception e) {
            log.error("Lỗi lấy danh sách ví để map tiền tệ: {}", e.getMessage());
        }
        return map;
    }
}
