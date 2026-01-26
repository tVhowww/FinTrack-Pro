package com.fintrack.transaction_service.controller;

import com.fintrack.transaction_service.dto.request.TransactionCreationRequest;
import com.fintrack.transaction_service.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/internal/transactions") // Endpoint nội bộ
@RequiredArgsConstructor
public class TransactionInternalController {
    private final TransactionService transactionService;

    @PostMapping("/adjustment")
    public void createAdjustment(@RequestBody TransactionCreationRequest request) {
        transactionService.createAdjustmentTransaction(request);
    }

    @GetMapping("/count-by-wallet/{walletId}")
    public long countByWallet(@PathVariable String walletId) {
        return transactionService.countTransactionsByWallet(walletId);
    }
}