package com.fintrack.wallet_service.repository.httpclient;

import com.fintrack.wallet_service.configuration.AuthenticationRequestInterceptor;
import com.fintrack.wallet_service.dto.request.TransactionCreationRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "transaction-service", path = "/transaction", url = "${app.services.transaction.url}", configuration = AuthenticationRequestInterceptor.class)
public interface TransactionClient {
    @PostMapping("/internal/transactions/adjustment")
    void createAdjustment(@RequestBody TransactionCreationRequest request);

    @GetMapping("/internal/transactions/count-by-wallet/{walletId}")
    long countByWallet(@PathVariable("walletId") String walletId);
}