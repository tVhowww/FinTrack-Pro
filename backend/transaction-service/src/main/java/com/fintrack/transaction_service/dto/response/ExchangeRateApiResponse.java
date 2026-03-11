package com.fintrack.transaction_service.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Map;

@Data
public class ExchangeRateApiResponse {
    private String result;

    // Đồng tiền gốc (VD: USD)
    @JsonProperty("base_code")
    private String baseCode;

    // SỬA Ở ĐÂY: Đổi "conversion_rates" thành "rates"
    @JsonProperty("rates")
    private Map<String, BigDecimal> conversionRates;
}