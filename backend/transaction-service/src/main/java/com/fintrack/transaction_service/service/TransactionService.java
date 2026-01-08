package com.fintrack.transaction_service.service;

import com.fintrack.transaction_service.dto.request.TransactionCreationRequest;
import com.fintrack.transaction_service.dto.request.WalletBalanceUpdateRequest;
import com.fintrack.transaction_service.dto.response.PageResponse;
import com.fintrack.transaction_service.dto.response.TransactionResponse;
import com.fintrack.transaction_service.entity.Transaction;
import com.fintrack.transaction_service.enums.TransactionType;
import com.fintrack.transaction_service.mapper.TransactionMapper;
import com.fintrack.transaction_service.repository.TransactionRepository;
import com.fintrack.transaction_service.repository.httpclient.WalletClient;
import com.fintrack.transaction_service.repository.specification.TransactionSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;

@Service
@RequiredArgsConstructor
public class TransactionService {
    private final TransactionRepository transactionRepository;
    private final TransactionMapper transactionMapper;
    private final WalletClient walletClient;

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
