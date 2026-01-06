package com.fintrack.transaction_service.repository.httpclient;

import com.fintrack.transaction_service.dto.request.WalletBalanceUpdateRequest;
import com.fintrack.transaction_service.dto.response.ApiResponse;
import com.fintrack.transaction_service.dto.response.WalletResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "wallet-service", path = "/wallet")
public interface WalletClient {
    // Khai báo hàm giống hệt Controller bên Wallet Service
    // URL đầy đủ sẽ là: http://wallet-service/wallet/internal/wallets/{id}/balance
    @PostMapping("/internal/wallets/{id}/balance")
    ApiResponse<WalletResponse> updateBalance(@PathVariable("id") String id,
                                              @RequestBody WalletBalanceUpdateRequest request);
}
