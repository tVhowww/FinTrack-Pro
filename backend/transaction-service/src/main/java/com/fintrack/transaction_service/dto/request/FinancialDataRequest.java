package com.fintrack.transaction_service.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyDescription;

public record FinancialDataRequest(
        @JsonProperty(required = true)
        @JsonPropertyDescription("Tháng cần tra cứu (từ 1 đến 12)")
        int month,

        @JsonProperty(required = true)
        @JsonPropertyDescription("Năm cần tra cứu (ví dụ: 2023, 2024, 2025)")
        int year
) {}