package com.fintrack.transaction_service.service;

import com.fintrack.transaction_service.dto.request.TransactionCreationRequest;
import com.fintrack.transaction_service.dto.request.WalletBalanceUpdateRequest;
import com.fintrack.transaction_service.dto.response.TransactionResponse;
import com.fintrack.transaction_service.entity.Transaction;
import com.fintrack.transaction_service.enums.TransactionType;
import com.fintrack.transaction_service.mapper.TransactionMapper;
import com.fintrack.transaction_service.repository.TransactionRepository;
import com.fintrack.transaction_service.repository.httpclient.WalletClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class TransactionService {
    private final TransactionRepository transactionRepository;
    private final TransactionMapper transactionMapper;
    private final WalletClient walletClient;

    @Transactional
    public TransactionResponse create(TransactionCreationRequest request) {
        // 1. Map và Lưu Transaction vào DB trước (Trạng thái Pending hoặc cứ lưu trước)
        Transaction transaction = transactionMapper.toTransaction(request);
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

        // 4. Trả về kết quả
        return transactionMapper.toTransactionResponse(transaction);
    }
}
