package com.fintrack.api_gateway.configuration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration corsConfiguration = new CorsConfiguration();

        // 1. Cho phép Frontend gọi vào (Quan trọng nhất)
        corsConfiguration.setAllowedOrigins(List.of("http://localhost:3000"));

        // 2. Cho phép tất cả các Header (Authorization, Content-Type...)
        corsConfiguration.setAllowedHeaders(List.of("*"));

        // 3. Cho phép tất cả các Method (GET, POST, PUT, DELETE, OPTIONS)
        corsConfiguration.setAllowedMethods(List.of("*"));

        // 4. Cho phép gửi Cookie/Credential (nếu cần sau này)
        corsConfiguration.setAllowCredentials(true);

        // 5. Áp dụng cấu hình này cho mọi đường dẫn (/**)
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfiguration);

        return new CorsWebFilter(source);
    }
}