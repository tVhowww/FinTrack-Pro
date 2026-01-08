package com.fintrack.transaction_service.configuration;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class InternalKeyInterceptor implements RequestInterceptor {

    @Value("${app.internal-secret}")
    private String internalSecret;

    @Override
    public void apply(RequestTemplate template) {
        // Tự động thêm header bí mật vào mọi request Feign gọi đi
        template.header("X-Internal-Secret", internalSecret);
    }
}