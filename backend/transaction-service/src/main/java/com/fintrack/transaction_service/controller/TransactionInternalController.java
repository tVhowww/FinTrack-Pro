package com.fintrack.transaction_service.controller;

import com.fintrack.transaction_service.dto.request.TransactionCreationRequest;
import com.fintrack.transaction_service.service.transaction.TransactionCommandService;
import com.fintrack.transaction_service.service.transaction.TransactionQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/internal/transactions") // Endpoint nội bộ
@RequiredArgsConstructor
public class TransactionInternalController {

    private final TransactionCommandService commandService;
    private final TransactionQueryService queryService;

    @PostMapping("/adjustment")
    public void createAdjustment(@RequestBody TransactionCreationRequest request) {
        commandService.createAdjustmentTransaction(request);
    }

    @GetMapping("/count-by-wallet/{walletId}")
    public long countByWallet(@PathVariable String walletId) {
        return queryService.countTransactionsByWallet(walletId);
    }
}