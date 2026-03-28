package com.fintrack.transaction_service.event.consumer;

import com.fintrack.transaction_service.dto.event.TransferResultEvent;
import com.fintrack.transaction_service.dto.request.WalletBalanceUpdateRequest;
import com.fintrack.transaction_service.entity.Category;
import com.fintrack.transaction_service.entity.Transaction;
import com.fintrack.transaction_service.enums.TransactionType;
import com.fintrack.transaction_service.enums.TransferStatus;
import com.fintrack.transaction_service.repository.CategoryRepository;
import com.fintrack.transaction_service.repository.TransactionRepository;
import com.fintrack.transaction_service.repository.httpclient.WalletClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class TransferSagaListener {

    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final WalletClient walletClient;

    // KỊCH BẢN 1: MỌI THỨ ỔN THỎA
    @KafkaListener(topics = "transfer.credit-completed", groupId = "transaction-saga-group")
    public void handleCreditCompleted(TransferResultEvent event) {
        List<Transaction> transactions = transactionRepository.findBySagaId(event.getSagaId());

        // Chuyển trạng thái 2 giao dịch (Thu & Chi) thành COMPLETED
        transactions.forEach(tx -> tx.setTransferStatus(TransferStatus.COMPLETED));
        transactionRepository.saveAll(transactions);
    }

    // KỊCH BẢN 2: THẤT BẠI (ĐỀN BÙ VÀ TẠO GIAO DỊCH HOÀN TIỀN)
    @KafkaListener(topics = "transfer.credit-failed", groupId = "transaction-saga-group")
    public void handleCreditFailed(TransferResultEvent event) {
        List<Transaction> transactions = transactionRepository.findBySagaId(event.getSagaId());

        // 1. Tìm lại cái giao dịch trừ tiền lúc đầu của người gửi
        Transaction expenseTx = transactions.stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE)
                .findFirst()
                .orElse(null);

        // 2. Tìm cái giao dịch cộng tiền (bị xịt) của người nhận
        Transaction incomeTx = transactions.stream()
                .filter(t -> t.getType() == TransactionType.INCOME)
                .findFirst()
                .orElse(null);

        if (expenseTx != null) {
            // A. GỌI API ĐỂ HOÀN TRẢ LẠI TIỀN VÀO VÍ NGUỒN
            WalletBalanceUpdateRequest refundRequest = WalletBalanceUpdateRequest.builder()
                    .amount(expenseTx.getAmount())
                    .build();
            walletClient.updateBalance(expenseTx.getWalletId(), refundRequest);

            Category refundCategory = categoryRepository.findByNameAndTypeAndUserIdIsNull("Hoàn tiền giao dịch", TransactionType.INCOME)
                    .orElseGet(() -> categoryRepository.save(Category.builder()
                            .name("Hoàn tiền giao dịch")
                            .type(TransactionType.INCOME)
                            .description("Hệ thống tự động tạo để hoàn tiền")
                            .build()));

            // B. TẠO HẲN 1 GIAO DỊCH MỚI TINH ĐỂ HIỂN THỊ LÊN GIAO DIỆN (FRONTEND TỰ HIỂU)
            Transaction refundTransaction = Transaction.builder()
                    .amount(expenseTx.getAmount())
                    .type(TransactionType.INCOME) // Hoàn tiền là một khoản THU
                    .walletId(expenseTx.getWalletId())
                    .date(Instant.now())
                    .note("Hoàn tiền do chuyển khoản thất bại (Mã lỗi: " + event.getReason() + ")")
                    .category(refundCategory)
                    .transferStatus(TransferStatus.COMPENSATED)
                    .sagaId(event.getSagaId())
                    .build();
            transactionRepository.save(refundTransaction);
        }

        // C. CẬP NHẬT TRẠNG THÁI 2 GIAO DỊCH GỐC THÀNH FAILED/COMPENSATED
        if (expenseTx != null) expenseTx.setTransferStatus(TransferStatus.COMPENSATED);

        // XÓA MỀM
        if (incomeTx != null) {
            incomeTx.setTransferStatus(TransferStatus.FAILED);
            incomeTx.setDeleted(true);
        }

        transactionRepository.saveAll(transactions);
    }
}
