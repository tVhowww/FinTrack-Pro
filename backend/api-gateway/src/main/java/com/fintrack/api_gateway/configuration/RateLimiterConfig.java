package com.fintrack.api_gateway.configuration;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import reactor.core.publisher.Mono;

@Configuration
@Slf4j
public class RateLimiterConfig {

    @Bean
    public KeyResolver ipKeyResolver() {
        return exchange -> {
            // Cố gắng lấy token từ header hoặc cookie
            String token = null;
            String authHeader = exchange.getRequest().getHeaders().getFirst(org.springframework.http.HttpHeaders.AUTHORIZATION);
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
            }
            if (token == null) {
                org.springframework.http.HttpCookie cookie =
                        exchange.getRequest().getCookies().getFirst("access_token");
                if (cookie != null) {
                    token = cookie.getValue();
                }
            }

            // Nếu có token -> Rate limit theo User (đại diện bằng chuỗi token)
            if (token != null && !token.isBlank()) {
                return Mono.just(token);
            }

            // Nếu không có token -> Public API -> Rate limit theo IP
            String ip = exchange.getRequest().getRemoteAddress() != null
                    ? exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
                    : "unknown_ip";

            return Mono.just(ip);
        };
    }
}