package com.fintrack.notification_service.exception;

import com.fintrack.notification_service.exception.ErrorCode;
import lombok.Getter;

@Getter
public class AppException extends RuntimeException {

    public AppException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    private final ErrorCode errorCode;
}
