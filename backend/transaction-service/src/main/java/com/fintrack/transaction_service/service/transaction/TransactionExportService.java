package com.fintrack.transaction_service.service.transaction;

import com.fintrack.transaction_service.entity.Transaction;
import com.fintrack.transaction_service.enums.TransactionType;
import com.fintrack.transaction_service.repository.TransactionRepository;
import com.fintrack.transaction_service.repository.specification.TransactionSpecification;
import com.fintrack.transaction_service.utils.ExcelHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.time.Instant;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransactionExportService {
    private final TransactionRepository transactionRepository;
    private final TransactionQueryService queryService; // Inject để lấy list ví

    public ByteArrayInputStream exportToExcel(String walletId, TransactionType type, Instant startDate, Instant endDate) {
        List<String> walletIds = queryService.resolveWalletIds(walletId);

        if (walletIds.isEmpty()) {
            return ExcelHelper.transactionsToExcel(Collections.emptyList());
        }

        Specification<Transaction> spec = Specification.where(TransactionSpecification.hasWalletIdIn(walletIds))
                .and(TransactionSpecification.hasType(type))
                .and(TransactionSpecification.createdBetween(startDate, endDate));

        List<Transaction> transactions = transactionRepository.findAll(spec, Sort.by("date").descending());
        return ExcelHelper.transactionsToExcel(transactions);
    }
}