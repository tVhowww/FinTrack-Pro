package com.fintrack.transaction_service.repository.httpclient;

import com.fintrack.transaction_service.dto.response.ApiResponse;
import com.fintrack.transaction_service.dto.response.UserResponse;
import org.springframework.stereotype.Component;

@Component // Phải là Bean để Spring quản lý
public class IdentityClientFallback implements IdentityClient {

    @Override
    public ApiResponse<UserResponse> getMyInfo() {
        return ApiResponse.<UserResponse>builder()
                .code(503)
                .message("Identity Service Unavailable")
                .result(null) 
                .build();
    }
}