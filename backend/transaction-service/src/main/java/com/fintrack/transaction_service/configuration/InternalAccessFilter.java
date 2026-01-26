package com.fintrack.transaction_service.configuration;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Filter bảo mật cho các endpoint /internal/*
 * Yêu cầu header X-Internal-Secret để xác thực request từ các service nội bộ
 */
@Component
@Slf4j
public class InternalAccessFilter extends OncePerRequestFilter {

    @Value("${app.internal-secret}")
    private String internalSecret;

    // Danh sách các đường dẫn được phép truy cập tự do (Swagger, Actuator)
    private final List<String> openApiEndpoints = List.of(
            "/**/swagger-ui/**",
            "/**/v3/api-docs/**",
            "/**/swagger-resources/**",
            "/**/webjars/**",
            "/**/actuator/**"
    );

    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String requestUri = request.getRequestURI();

        // 1. Kiểm tra xem request có nằm trong danh sách Whitelist không?
        boolean isWhitelisted = openApiEndpoints.stream()
                .anyMatch(pattern -> pathMatcher.match(pattern, requestUri));

        if (isWhitelisted) {
            // Nếu là endpoint public -> Cho qua luôn
            filterChain.doFilter(request, response);
            return;
        }

        // 2. Kiểm tra xem có phải internal endpoint không
        boolean isInternalEndpoint = pathMatcher.match("/**/internal/**", requestUri);

        if (isInternalEndpoint) {
            // Bắt buộc check Secret Key cho internal endpoints
            String requestSecret = request.getHeader("X-Internal-Secret");

            if (internalSecret == null || !internalSecret.equals(requestSecret)) {
                log.warn("Unauthorized access attempt to internal endpoint: {} from IP: {}",
                        requestUri, request.getRemoteAddr());
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\":\"Forbidden: Direct access is not allowed. Please use API Gateway.\"}");
                return;
            }
        }

        // 3. Cho đi tiếp vào Controller
        filterChain.doFilter(request, response);
    }
}

