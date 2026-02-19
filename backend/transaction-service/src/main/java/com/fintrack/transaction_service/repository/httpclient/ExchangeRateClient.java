package com.fintrack.transaction_service.repository.httpclient;

import com.fintrack.transaction_service.dto.response.ExchangeRateApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "exchange-rate-client", url = "${app.exchange-rate.url}")
public interface ExchangeRateClient {

    @GetMapping("/latest/{baseCurrency}")
    ExchangeRateApiResponse getLatestRates(
            @PathVariable("baseCurrency") String baseCurrency
    );
}