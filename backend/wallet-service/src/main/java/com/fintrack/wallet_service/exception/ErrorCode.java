package com.fintrack.wallet_service.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001, "Uncategorized error", HttpStatus.BAD_REQUEST),
    UNAUTHENTICATED(1006, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1007, "You do not have permission", HttpStatus.FORBIDDEN),

    // --- Lỗi nghiệp vụ Wallet (Bắt đầu từ 2xxx) ---
    WALLET_EXISTED(2001, "Wallet already exists", HttpStatus.BAD_REQUEST),
    WALLET_NOT_FOUND(2002, "Wallet not found", HttpStatus.NOT_FOUND),
    INVALID_BALANCE(2003, "Balance cannot be negative", HttpStatus.BAD_REQUEST),
    WALLET_NAME_INVALID(2004, "Wallet name is invalid", HttpStatus.BAD_REQUEST),
    INSUFFICIENT_BALANCE(2005, "Insufficient balance", HttpStatus.BAD_REQUEST),
    TRANSACTION_SERVICE_ERROR(2006, "Failed to create transaction history", HttpStatus.INTERNAL_SERVER_ERROR),
    WALLET_HAS_TRANSACTIONS(2007, "Không thể đổi đơn vị tiền tệ vì ví đã có giao dịch phát sinh", HttpStatus.BAD_REQUEST),
    CONCURRENT_BALANCE_UPDATE(2008, "Wallet balance is being updated, please retry", HttpStatus.CONFLICT),
    REQUEST_PROCESSING(2030, "Request is being processed, please try again later", HttpStatus.TOO_MANY_REQUESTS)
    ;

    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;
}
