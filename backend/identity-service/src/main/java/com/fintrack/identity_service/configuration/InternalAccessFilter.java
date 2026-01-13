package com.fintrack.identity_service.configuration;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class InternalAccessFilter extends OncePerRequestFilter {

    @Value("${app.internal-secret}")
    private String internalSecret;

    // Danh sách các đường dẫn được phép truy cập tự do (Swagger)
    private final List<String> openApiEndpoints = List.of(
            "/**/swagger-ui/**",
            "/**/v3/api-docs/**",
            "/**/swagger-resources/**",
            "/**/webjars/**"
    );

    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String requestUri = request.getRequestURI();

        // 1. Kiểm tra xem request có nằm trong danh sách Whitelist (Swagger) không?
        boolean isWhitelisted = openApiEndpoints.stream()
                .anyMatch(pattern -> pathMatcher.match(pattern, requestUri));

        if (isWhitelisted) {
            // Nếu là Swagger -> Cho qua luôn, không check Secret
            filterChain.doFilter(request, response);
            return;
        }

        // 2. Nếu không phải Swagger -> Bắt buộc check Secret Key
        String requestSecret = request.getHeader("X-Internal-Secret");

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