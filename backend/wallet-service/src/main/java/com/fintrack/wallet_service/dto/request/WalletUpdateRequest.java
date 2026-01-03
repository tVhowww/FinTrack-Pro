package com.fintrack.wallet_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class WalletUpdateRequest {
    @NotBlank(message = "WALLET_NAME_INVALID") // Nhớ thêm mã lỗi này vào enum ErrorCode nếu chưa có
    private String name;

     private String currency;
}