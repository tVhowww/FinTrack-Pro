package com.fintrack.transaction_service.repository.httpclient;

import com.fintrack.transaction_service.configuration.FeignClientConfig;
import com.fintrack.transaction_service.dto.request.WalletBalanceUpdateRequest;
import com.fintrack.transaction_service.dto.response.ApiResponse;
import com.fintrack.transaction_service.dto.response.WalletResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

@FeignClient(name = "wallet-service", url = "${WALLET_SERVICE_URL:}", path = "/wallet", configuration = FeignClientConfig.class)
public interface WalletClient {
    // Khai báo hàm giống hệt Controller bên Wallet Service
    // URL đầy đủ sẽ là: http://wallet-service/wallet/internal/wallets/{id}/balance
    @PostMapping("/internal/wallets/{id}/balance")
    ApiResponse<WalletResponse> updateBalance(@PathVariable("id") String id,
                                              @RequestBody WalletBalanceUpdateRequest request);

    @GetMapping("/wallets/{id}")
    ApiResponse<WalletResponse> getWallet(@PathVariable("id") String id);

    @GetMapping("/wallets")
    ApiResponse<List<WalletResponse>> getMyWallets();
}
