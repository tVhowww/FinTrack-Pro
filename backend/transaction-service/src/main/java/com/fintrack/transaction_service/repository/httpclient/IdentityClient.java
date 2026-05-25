package com.fintrack.transaction_service.repository.httpclient;

import com.fintrack.transaction_service.configuration.AuthenticationRequestInterceptor;
import com.fintrack.transaction_service.dto.response.ApiResponse;
import com.fintrack.transaction_service.dto.response.UserResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

// name: tên service trên Eureka
// configuration: để tự động gắn Token vào header
@FeignClient(name = "identity-service", path = "/identity", configuration = AuthenticationRequestInterceptor.class , fallback = IdentityClientFallback.class)
public interface IdentityClient {

    // Gọi API lấy thông tin chính chủ (My Info) bên Identity
    // Đảm bảo bên Identity bạn có API này nhé (thường là /users/my-info)
    @GetMapping("/users/my-info")
    ApiResponse<UserResponse> getMyInfo();
}