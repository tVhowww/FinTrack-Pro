package com.fintrack.wallet_service.controller;

import com.fintrack.wallet_service.dto.request.WalletBalanceUpdateRequest;
import com.fintrack.wallet_service.dto.response.ApiResponse;
import com.fintrack.wallet_service.dto.response.WalletResponse;
import com.fintrack.wallet_service.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/internal/wallets") // URL riêng cho nội bộ
@RequiredArgsConstructor
public class InternalWalletController {
    private final WalletService walletService;

    @PostMapping("/{id}/balance")
    ApiResponse<WalletResponse> updateBalance(@PathVariable String id, @RequestBody WalletBalanceUpdateRequest request) {
        return ApiResponse.<WalletResponse>builder()
                .result(walletService.updateBalance(id, request))
                .build();
    }
}
