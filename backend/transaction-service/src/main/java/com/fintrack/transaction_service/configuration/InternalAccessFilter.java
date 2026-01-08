package com.fintrack.transaction_service.configuration;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class InternalAccessFilter extends OncePerRequestFilter {

    @Value("${app.internal-secret}")
    private String internalSecret;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // 1. Lấy header bí mật từ request gửi đến
        String requestSecret = request.getHeader("X-Internal-Secret");

        // 2. So sánh với key trong file cấu hình
        if (internalSecret == null || !internalSecret.equals(requestSecret)) {
            // Nếu sai hoặc không có -> Chặn ngay lập tức
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.getWriter().write("Forbidden: Direct access is not allowed. Please use API Gateway.");
            return;
        }

        // 3. Nếu đúng -> Cho đi tiếp vào Controller
        filterChain.doFilter(request, response);
    }
}