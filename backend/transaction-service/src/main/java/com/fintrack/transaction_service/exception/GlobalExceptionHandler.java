package com.fintrack.transaction_service.exception;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fintrack.transaction_service.dto.response.ApiResponse;
import feign.FeignException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(value = Exception.class)
    ResponseEntity<ApiResponse> handlingUncategorizedException(Exception exception) {
        log.error("Exception: ", exception);

        ApiResponse apiResponse = new ApiResponse();

        apiResponse.setCode(ErrorCode.UNCATEGORIZED_EXCEPTION.getCode());
        apiResponse.setMessage(ErrorCode.UNCATEGORIZED_EXCEPTION.getMessage());
        // Thêm dòng này để debug cho dễ nếu cần, khi production thì bỏ đi
        // apiResponse.setMessage(exception.getMessage());

        return ResponseEntity.internalServerError().body(apiResponse);
    }

    @ExceptionHandler(value = AppException.class)
    ResponseEntity<ApiResponse> handlingAppException(AppException exception) {
        ErrorCode errorCode = exception.getErrorCode();
        ApiResponse apiResponse = new ApiResponse();
        apiResponse.setCode(errorCode.getCode());
        apiResponse.setMessage(errorCode.getMessage());
        return ResponseEntity.status(errorCode.getStatusCode()).body(apiResponse);
    }

    // Xử lý lỗi @Valid (Ví dụ: Tên ví để trống)
    @ExceptionHandler(value = MethodArgumentNotValidException.class)
    ResponseEntity<ApiResponse> handlingValidation(MethodArgumentNotValidException exception) {
        String enumKey = exception.getFieldError().getDefaultMessage();
        ErrorCode errorCode = ErrorCode.INVALID_KEY;
        try {
            errorCode = ErrorCode.valueOf(enumKey);
        } catch (IllegalArgumentException e) {
            // Log error nếu cần
        }
        ApiResponse apiResponse = new ApiResponse();
        apiResponse.setCode(errorCode.getCode());
        apiResponse.setMessage(errorCode.getMessage());
        return ResponseEntity.badRequest().body(apiResponse);
    }

    // Xử lý lỗi 403 Forbidden
    @ExceptionHandler(AuthorizationDeniedException.class)
    ResponseEntity<ApiResponse> handleAuthorizationDeniedException(AuthorizationDeniedException exception) {
        ErrorCode errorCode = ErrorCode.UNAUTHORIZED;
        return ResponseEntity.status(errorCode.getStatusCode())
                .body(ApiResponse.builder()
                        .code(errorCode.getCode())
                        .message(errorCode.getMessage())
                        .build());
    }

    @ExceptionHandler(FeignException.class)
    public ResponseEntity<ApiResponse> handleFeignException(FeignException exception) {
        try {
            // 1. Lấy Http Status (Ví dụ: 400 Bad Request)
            int status = exception.status();
            // Nếu status < 0 (lỗi kết nối...), set mặc định là 400
            if (status < 0) status = 400;

            // 2. Lấy nội dung lỗi (JSON từ Wallet Service gửi sang)
            String content = exception.contentUTF8();

            // Nếu không có nội dung, trả về lỗi chung chung
            if (content == null || content.isEmpty()) {
                return ResponseEntity.status(status).body(
                        ApiResponse.builder()
                                .code(ErrorCode.UNCATEGORIZED_EXCEPTION.getCode())
                                .message(exception.getMessage())
                                .build()
                );
            }

            // 3. Map JSON String sang Object ApiResponse để lấy message đẹp
            ObjectMapper mapper = new ObjectMapper();
            // Đọc JSON thành Map hoặc ApiResponse class tùy cấu trúc bạn muốn
            // Ở đây mình đọc thành Map cho linh hoạt, hoặc bạn có thể map thẳng class ApiResponse
            ApiResponse apiResponse = mapper.readValue(content, ApiResponse.class);

            // 4. Trả về lỗi xịn xò cho User
            return ResponseEntity.status(status).body(apiResponse);

        } catch (Exception e) {
            // Phòng trường hợp parse JSON bị lỗi thì trả về lỗi mặc định
            return ResponseEntity.badRequest().body(
                    ApiResponse.builder()
                            .code(ErrorCode.UNCATEGORIZED_EXCEPTION.getCode())
                            .message(exception.getMessage())
                            .build()
            );
        }
    }
}
