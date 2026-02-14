package com.fintrack.transaction_service.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001, "Uncategorized error", HttpStatus.BAD_REQUEST),
    UNAUTHENTICATED(1006, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1007, "You do not have permission", HttpStatus.FORBIDDEN),

    // --- Lỗi nghiệp vụ (Bắt đầu từ 2xxx) ---
    INSUFFICIENT_BALANCE(2005, "Insufficient balance", HttpStatus.BAD_REQUEST),
    CATEGORY_PARENT_NOT_FOUND(2006, "Category Parent not found", HttpStatus.NOT_FOUND),
    CATEGORY_NOT_FOUND(2007, "Category not found", HttpStatus.NOT_FOUND),
    CATEGORY_TYPE_MISMATCH(2008, "Category type mismatch", HttpStatus.BAD_REQUEST),
    CATEGORY_EXISTED(2009, "Category with the same name already exists", HttpStatus.BAD_REQUEST),
    CATEGORY_SYSTEM_READONLY(2010, "Cannot modify default system categories", HttpStatus.FORBIDDEN),
    CATEGORY_INVALID_PARENT(2011, "Invalid parent category", HttpStatus.BAD_REQUEST),
    TRANSACTION_NOT_FOUND(2015, "Transaction not found", HttpStatus.NOT_FOUND),
    WALLET_NOT_FOUND(2020, "Wallet not found", HttpStatus.NOT_FOUND),
    BUDGET_ALREADY_EXISTS(2025, "Budget with the same name already exists for the month", HttpStatus.BAD_REQUEST),
    BUDGET_NOT_FOUND(2026, "Budget not found", HttpStatus.NOT_FOUND)
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
