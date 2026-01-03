package com.fintrack.wallet_service.controller;

import com.fintrack.wallet_service.dto.request.WalletCreationRequest;
import com.fintrack.wallet_service.dto.response.ApiResponse;
import com.fintrack.wallet_service.dto.response.WalletResponse;
import com.fintrack.wallet_service.service.WalletService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/wallets")
@RequiredArgsConstructor
public class WalletController {
    private final WalletService walletService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    ApiResponse<WalletResponse> createWallet(@RequestBody @Valid WalletCreationRequest request) {
        return ApiResponse.<WalletResponse>builder()
                .result(walletService.create(request))
                .build();
    }
}
