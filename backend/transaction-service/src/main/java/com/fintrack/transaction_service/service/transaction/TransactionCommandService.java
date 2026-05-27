package com.fintrack.transaction_service.service.transaction;

import com.fintrack.transaction_service.dto.event.TransferDebitEvent;
import com.fintrack.transaction_service.dto.request.*;
import com.fintrack.transaction_service.dto.response.TransactionResponse;
import com.fintrack.transaction_service.dto.response.WalletResponse;
import com.fintrack.transaction_service.entity.Category;
import com.fintrack.transaction_service.entity.Transaction;
import com.fintrack.transaction_service.enums.TransactionType;
import com.fintrack.transaction_service.enums.TransferStatus;
import com.fintrack.transaction_service.exception.AppException;
import com.fintrack.transaction_service.exception.ErrorCode;
import com.fintrack.transaction_service.mapper.TransactionMapper;
import com.fintrack.transaction_service.repository.CategoryRepository;
import com.fintrack.transaction_service.repository.TransactionRepository;
import com.fintrack.transaction_service.repository.httpclient.IdentityClient;
import com.fintrack.transaction_service.repository.httpclient.WalletClient;
import com.fintrack.transaction_service.service.budget.BudgetAlertEngine;
import com.fintrack.transaction_service.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionCommandService {
    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final TransactionMapper transactionMapper;
    private final WalletClient walletClient;
    private final IdentityClient identityClient;
    private final OutboxService outboxService;
    private final StringRedisTemplate redisTemplate;
    private final BudgetAlertEngine budgetAlertEngine;
    private final TransactionNotificationWorker notificationWorker;

    // Inject QueryService để xài lại hàm Validate
    private final TransactionQueryService queryService;

    private WalletBalanceUpdateRequest balanceUpdate(BigDecimal amount, String idempotencyKey) {
        return WalletBalanceUpdateRequest.builder()
                .amount(amount)
                .idempotencyKey(idempotencyKey)
                .build();
    }

    @Transactional
    public TransactionResponse create(TransactionCreationRequest request) {
        String currentUserId = SecurityUtils.getCurrentUserId();
        String lockKey = "lock:create_transaction:" + currentUserId;
        Boolean acquired = redisTemplate.opsForValue().setIfAbsent(lockKey, "LOCKED", 30, TimeUnit.SECONDS);
        if (Boolean.FALSE.equals(acquired)) throw new AppException(ErrorCode.REQUEST_PROCESSING);
        try {
            return createInternal(request);
        } finally {
            redisTemplate.delete(lockKey);
        }
    }

    private TransactionResponse createInternal(TransactionCreationRequest request) {
        // [EVENTUAL CONSISTENCY] Dùng tryGetWallet() thay vì validateAndGetWallet().
        // Nếu Wallet-Service offline, wallet = null và transaction vẫn được lưu.
        // Outbox relay sẽ cập nhật số dư sau khi Wallet-Service khôi phục.
        WalletResponse wallet = queryService.tryGetWallet(request.getWalletId());
        Category category = null;

        if (wallet != null && "SAVING".equals(wallet.getType())) {
            String sysCatName = (request.getType() == TransactionType.INCOME) ? "Nạp tiền tích lũy" : "Rút tiền tích lũy";
            category = getOrCreateSystemCategory(sysCatName, request.getType());
            if (request.getNote() == null || request.getNote().trim().isEmpty()) request.setNote(sysCatName);
        } else if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId()).orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
        }

        Transaction transaction = transactionMapper.toTransaction(request);
        transaction.setCategory(category);
        // [ATOMICITY] Transaction và OutboxEvent được lưu trong cùng 1 DB transaction.
        transaction = transactionRepository.save(transaction);

        BigDecimal updateAmount = request.getType() == TransactionType.EXPENSE ? request.getAmount().negate() : request.getAmount();
        outboxService.saveEvent("walletClient", "WALLET_UPDATE",
                new OutboxWalletUpdatePayload(request.getWalletId(), balanceUpdate(updateAmount, "transaction:create:" + transaction.getId())));

        String recipientEmail = null, username = "Người dùng", currency = "VND";
        try {
            var userResponse = identityClient.getMyInfo();
            if (userResponse != null && userResponse.getResult() != null) {
                recipientEmail = userResponse.getResult().getEmail();
                username = userResponse.getResult().getUsername();
            }
            if (wallet != null) currency = wallet.getCurrency();
        } catch (Exception e) { log.error("Lỗi lấy thông tin user: {}", e.getMessage()); }

        notificationWorker.sendTransactionNotification(transaction, category, recipientEmail, username, currency);
        budgetAlertEngine.checkAndAlert(transaction, recipientEmail, username);

        return transactionMapper.toTransactionResponse(transaction);
    }

    @Transactional
    public TransactionResponse update(String id, TransactionUpdateRequest request) {
        String operationId = java.util.UUID.randomUUID().toString();
        Transaction transaction = transactionRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.TRANSACTION_NOT_FOUND));
        // [EVENTUAL CONSISTENCY] Dùng tryGetWallet() – balance revert/apply vẫn được enqueue qua Outbox.
        WalletResponse wallet = queryService.tryGetWallet(transaction.getWalletId());

        BigDecimal revertAmount = transaction.getType() == TransactionType.INCOME ? transaction.getAmount().negate() : transaction.getAmount();
        outboxService.saveEvent("walletClient", "WALLET_UPDATE", 
                new OutboxWalletUpdatePayload(transaction.getWalletId(), balanceUpdate(revertAmount, "transaction:update:" + id + ":" + operationId + ":revert")));

        if (wallet != null && "SAVING".equals(wallet.getType())) {
            String sysCatName = (transaction.getType() == TransactionType.INCOME) ? "Nạp tiền tích lũy" : "Rút tiền tích lũy";
            transaction.setCategory(getOrCreateSystemCategory(sysCatName, transaction.getType()));
        } else if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId()).orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
            transaction.setCategory(category);
        }

        if (request.getAmount() != null) transaction.setAmount(request.getAmount());
        if (request.getNote() != null) transaction.setNote(request.getNote());
        if (request.getDate() != null) transaction.setDate(request.getDate());

        transaction = transactionRepository.save(transaction);
        BigDecimal newUpdateAmount = transaction.getType() == TransactionType.EXPENSE ? transaction.getAmount().negate() : transaction.getAmount();
        outboxService.saveEvent("walletClient", "WALLET_UPDATE", 
                new OutboxWalletUpdatePayload(transaction.getWalletId(), balanceUpdate(newUpdateAmount, "transaction:update:" + id + ":" + operationId + ":apply")));

        String recipientEmail = null, username = "Người dùng";
        try {
            var userResponse = identityClient.getMyInfo();
            if (userResponse != null && userResponse.getResult() != null) {
                recipientEmail = userResponse.getResult().getEmail();
                username = userResponse.getResult().getUsername();
            }
        } catch (Exception e) { log.error("Lỗi lấy thông tin user: {}", e.getMessage()); }

        budgetAlertEngine.checkAndAlert(transaction, recipientEmail, username);
        return transactionMapper.toTransactionResponse(transaction);
    }

    @Transactional
    public void delete(String id) {
        Transaction transaction = transactionRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.TRANSACTION_NOT_FOUND));
        // [EVENTUAL CONSISTENCY] Không block nếu Wallet-Service offline.
        // OutboxEvent vẫn được enqueue để hoàn tiền; Wallet-Service sẽ xử lý khi khôi phục.
        queryService.tryGetWallet(transaction.getWalletId());

        BigDecimal revertAmount = transaction.getType() == TransactionType.INCOME ? transaction.getAmount().negate() : transaction.getAmount();
        outboxService.saveEvent("walletClient", "WALLET_UPDATE",
                new OutboxWalletUpdatePayload(transaction.getWalletId(), balanceUpdate(revertAmount, "transaction:delete:" + id)));

        transaction.setDeleted(true);
        transactionRepository.save(transaction);
        log.info("Đã xóa giao dịch {} và enqueue hoàn tiền ví {} qua Outbox", id, transaction.getWalletId());
    }

    @Transactional
    public TransactionResponse transfer(TransferRequest request) {
        String currentUserId = SecurityUtils.getCurrentUserId();
        String lockKey = "lock:transfer_transaction:" + currentUserId;
        Boolean acquired = redisTemplate.opsForValue().setIfAbsent(lockKey, "LOCKED", 30, TimeUnit.SECONDS);
        if (Boolean.FALSE.equals(acquired)) throw new AppException(ErrorCode.REQUEST_PROCESSING);

        try {
            // [EVENTUAL CONSISTENCY] Dùng tryGetWallet() cho transfer flow.
            WalletResponse fromWallet = queryService.tryGetWallet(request.getFromWalletId());
            WalletResponse toWallet = queryService.tryGetWallet(request.getToWalletId());

            if (fromWallet != null && fromWallet.getBalance() != null && fromWallet.getBalance().compareTo(request.getAmount()) < 0) {
                throw new AppException(ErrorCode.INSUFFICIENT_BALANCE);
            }

            Instant transactionDate = request.getDate() != null ? request.getDate() : Instant.now();
            Category transferOutCategory = getOrCreateSystemCategory("Chuyển tiền đi", TransactionType.EXPENSE);
            Category transferInCategory = getOrCreateSystemCategory("Nhận tiền đến", TransactionType.INCOME);
            String sagaId = java.util.UUID.randomUUID().toString();

            String toWalletName = toWallet != null ? toWallet.getName() : "ví đích";
            String fromWalletName = fromWallet != null ? fromWallet.getName() : "ví nguồn";

            Transaction expenseTx = Transaction.builder().amount(request.getAmount()).type(TransactionType.EXPENSE)
                    .walletId(request.getFromWalletId()).date(transactionDate)
                    .note(request.getNote() != null && !request.getNote().isEmpty() ? request.getNote() : "Chuyển tiền sang ví " + toWalletName)
                    .category(transferOutCategory).sagaId(sagaId).transferStatus(TransferStatus.PENDING).build();
            transactionRepository.save(expenseTx);

            Transaction incomeTx = Transaction.builder().amount(request.getAmount()).type(TransactionType.INCOME)
                    .walletId(request.getToWalletId()).date(transactionDate).note("Nhận tiền từ quỹ " + fromWalletName)
                    .category(transferInCategory).sagaId(sagaId).transferStatus(TransferStatus.PENDING).build();
            transactionRepository.save(incomeTx);

            outboxService.saveEvent("walletClient", "WALLET_UPDATE", 
                    new OutboxWalletUpdatePayload(request.getFromWalletId(), balanceUpdate(request.getAmount().negate(), "transfer:" + sagaId + ":debit")));

            TransferDebitEvent event = TransferDebitEvent.builder().sagaId(sagaId).fromWalletId(request.getFromWalletId())
                    .toWalletId(request.getToWalletId()).amount(request.getAmount()).note(request.getNote()).date(transactionDate).build();
            
            outboxService.saveEvent("transfer.debit-completed", "KAFKA_PUBLISH", event);

            return transactionMapper.toTransactionResponse(expenseTx);
        } finally {
            redisTemplate.delete(lockKey);
        }
    }

    @Transactional
    public void createAdjustmentTransaction(TransactionCreationRequest request) {
        Category category = getOrCreateSystemCategory("Điều chỉnh số dư", request.getType());
        Transaction transaction = transactionMapper.toTransaction(request);
        transaction.setCategory(category);
        if (transaction.getNote() == null || transaction.getNote().isEmpty()) transaction.setNote("Điều chỉnh số dư thủ công");

        transaction = transactionRepository.save(transaction);

        String recipientEmail = null, username = "Người dùng", currency = "VND";
        try {
            var userResponse = identityClient.getMyInfo();
            if (userResponse != null && userResponse.getResult() != null) {
                recipientEmail = userResponse.getResult().getEmail();
                username = userResponse.getResult().getUsername();
            }
            var walletResponse = walletClient.getWallet(request.getWalletId());
            if (walletResponse != null && walletResponse.getResult() != null) currency = walletResponse.getResult().getCurrency();
        } catch (Exception e) { log.error("Lỗi lấy thông tin user: {}", e.getMessage()); }

        notificationWorker.sendTransactionNotification(transaction, category, recipientEmail, username, currency);
    }

    private synchronized Category getOrCreateSystemCategory(String name, TransactionType type) {
        return categoryRepository.findByNameAndTypeAndUserIdIsNull(name, type)
                .orElseGet(() -> categoryRepository.save(Category.builder().name(name).type(type).userId(null).description("Danh mục hệ thống tự động tạo").build()));
    }
}
