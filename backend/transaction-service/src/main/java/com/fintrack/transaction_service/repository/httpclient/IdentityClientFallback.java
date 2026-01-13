package com.fintrack.transaction_service.repository.httpclient;

import com.fintrack.transaction_service.dto.response.ApiResponse;
import com.fintrack.transaction_service.dto.response.UserResponse;
import org.springframework.stereotype.Component;

@Component // Phải là Bean để Spring quản lý
public class IdentityClientFallback implements IdentityClient {

    @Override
    public ApiResponse<UserResponse> getMyInfo() {
        // Đây là dữ liệu giả sẽ trả về khi Identity Service bị sập
        UserResponse fallbackUser = UserResponse.builder()
                .id("unknown")
                .username("User (Hệ thống bận)")
                .email("admin@fintrack.com") // Gửi tạm về admin hoặc email mặc định
                .fullName("Unknown")
                .build();

        return ApiResponse.<UserResponse>builder()
                .result(fallbackUser)
                .build();
    }
}