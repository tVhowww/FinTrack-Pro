package com.fintrack.transaction_service.configuration;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

public class AuthenticationRequestInterceptor implements RequestInterceptor {
    @Override
    public void apply(RequestTemplate template) {
        // Lấy thông tin request hiện tại (đang nằm ở Transaction Controller)
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();

        if (attributes != null) {
            // Lấy Header Authorization (Bearer eyJ...)
            String authHeader = attributes.getRequest().getHeader("Authorization");

            // Nếu có Token, gắn nó vào header của request Feign gửi đi
            if (StringUtils.hasText(authHeader)) {
                template.header("Authorization", authHeader);
            }
        }
    }
}