package com.fintrack.api_gateway.configuration;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fintrack.api_gateway.dto.response.ApiResponse;
import com.fintrack.api_gateway.service.IdentityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
@Slf4j
public class AuthenticationGatewayFilterFactory extends AbstractGatewayFilterFactory<AuthenticationGatewayFilterFactory.Config> {

    private final IdentityService identityService;
    private final ObjectMapper objectMapper; // Dùng để convert object sang JSON

    public AuthenticationGatewayFilterFactory(IdentityService identityService, ObjectMapper objectMapper) {
        super(Config.class);
        this.identityService = identityService;
        this.objectMapper = objectMapper;
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            // 1. Lấy giá trị Header Authorization ra
            // Thay vì kiểm tra containsKey, ta lấy thẳng ra xem có null không
            String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

            // 2. Kiểm tra null và định dạng "Bearer "
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return onError(exchange, "Missing or invalid authorization header", HttpStatus.UNAUTHORIZED);
            }

            String token = authHeader.substring(7); // Cắt bỏ chữ "Bearer "

            // 3. Nếu OK thì cho đi tiếp
            return identityService.introspect(token)
                    .flatMap(introspectResponse -> {
                        if (introspectResponse.isValid()) {
                            // Token ngon -> Cho đi tiếp
                            return chain.filter(exchange);
                        } else {
                            // Token rác -> Chặn
                            return onError(exchange, "Invalid Token", HttpStatus.UNAUTHORIZED);
                        }
                    })
                    // Xử lý lỗi nếu gọi Identity Service thất bại (ví dụ Service chết)
                    .onErrorResume(throwable -> {
                        // LOGGING QUAN TRỌNG: Nếu rơi vào đây nghĩa là Gateway KHÔNG GỌI ĐƯỢC Identity Service
                        log.error("GATEWAY: Error calling Identity Service", throwable);
                        return onError(exchange, "Identity Service Unreachable", HttpStatus.UNAUTHORIZED);
                    });
        };
    }

    // Trả về JSON body để Postman hiện lỗi
    private Mono<Void> onError(ServerWebExchange exchange, String message, HttpStatus httpStatus) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(httpStatus);
        response.getHeaders().add(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);

        ApiResponse<?> apiResponse = ApiResponse.builder()
                .code(httpStatus.value())
                .message(message)
                .build();

        String body = "";
        try {
            body = objectMapper.writeValueAsString(apiResponse);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }

        return response.writeWith(Mono.just(response.bufferFactory().wrap(body.getBytes())));
    }

    // Class Config rỗng (dùng để truyền tham số nếu cần sau này)
    public static class Config {
    }

}
