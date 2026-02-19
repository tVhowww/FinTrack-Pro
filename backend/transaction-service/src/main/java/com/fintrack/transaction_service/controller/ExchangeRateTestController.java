package com.fintrack.transaction_service.controller;

import com.fintrack.transaction_service.dto.response.ExchangeRateApiResponse;
import com.fintrack.transaction_service.repository.httpclient.ExchangeRateClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/test/exchange-rate")
public class ExchangeRateTestController {

    private final ExchangeRateClient exchangeRateClient;

    public ExchangeRateTestController(ExchangeRateClient exchangeRateClient) {
        this.exchangeRateClient = exchangeRateClient;
    }

    @GetMapping("/{baseCurrency}")
    public ExchangeRateApiResponse testGetRates(@PathVariable String baseCurrency) {
        // Chỉ truyền vào mã tiền tệ (VD: USD, VND)
        return exchangeRateClient.getLatestRates(baseCurrency.toUpperCase());
    }
}