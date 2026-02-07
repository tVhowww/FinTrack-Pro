package com.fintrack.identity_service.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    // 500
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),

    // 400
    INVALID_KEY(1001, "Uncategorized error", HttpStatus.BAD_REQUEST),
    USER_EXISTED(1002, "User existed", HttpStatus.BAD_REQUEST),
    USERNAME_INVALID(1003, "Username must be at least 4 characters", HttpStatus.BAD_REQUEST),
    PASSWORD_INVALID(1004, "Password must be at least 6 characters", HttpStatus.BAD_REQUEST),
    INVALID_KEY_MESSAGE(1005, "Invalid message key", HttpStatus.BAD_REQUEST),
    PASSWORD_INCORRECT(1010, "Password is incorrect", HttpStatus.BAD_REQUEST),

    // 401
    UNAUTHENTICATED(1006, "Unauthenticated", HttpStatus.UNAUTHORIZED),

    // 403
    UNAUTHORIZED(1007, "You do not have permission", HttpStatus.FORBIDDEN),

    // 404
    USER_NOT_EXISTED(1008, "User not existed", HttpStatus.NOT_FOUND),
    ROLE_NOT_EXISTED(1009, "Role not existed", HttpStatus.NOT_FOUND),

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
