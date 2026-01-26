package com.fintrack.wallet_service.configuration;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Component
public class AuthenticationRequestInterceptor implements RequestInterceptor {

    @Value("${app.internal-secret}")
    private String internalSecret;

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

        // Gửi internal secret để vượt qua filter bảo mật
        template.header("X-Internal-Secret", internalSecret);
    }
}