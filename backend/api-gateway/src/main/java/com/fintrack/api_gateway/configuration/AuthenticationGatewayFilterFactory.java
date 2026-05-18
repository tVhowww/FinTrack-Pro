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
import org.springframework.util.AntPathMatcher;
import org.springframework.http.HttpMethod;

import java.util.List;

@Component
@Slf4j
public class AuthenticationGatewayFilterFactory extends AbstractGatewayFilterFactory<AuthenticationGatewayFilterFactory.Config> {

    private final IdentityService identityService;
    private final ObjectMapper objectMapper; // Dùng để convert object sang JSON
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    public AuthenticationGatewayFilterFactory(IdentityService identityService, ObjectMapper objectMapper) {
        super(Config.class);
        this.identityService = identityService;
        this.objectMapper = objectMapper;
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            // KIỂM TRA PUBLIC ENDPOINTS (QUAN TRỌNG)
            String path = exchange.getRequest().getURI().getPath();
            HttpMethod method = exchange.getRequest().getMethod();
            if (isPublicEndpoint(path, method)) {
                return chain.filter(exchange);
            }

            // --- TOKEN EXTRACTION ---
            // Strategy: Try Authorization header first, then fall back to HttpOnly cookie.
            // This supports both API clients (Postman/Swagger with Bearer header)
            // and the browser frontend (HttpOnly cookie via withCredentials).
            String token = null;

            // 1. Try the Authorization header
            String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
            }

            // 2. Fallback: read from the HttpOnly "access_token" cookie
            if (token == null) {
                org.springframework.http.HttpCookie cookie =
                        exchange.getRequest().getCookies().getFirst("access_token");
                if (cookie != null) {
                    token = cookie.getValue();
                }
            }

            // 3. No token found anywhere → reject
            if (token == null || token.isBlank()) {
                return onError(exchange, "Missing authorization token", HttpStatus.UNAUTHORIZED);
            }

            // --- INTROSPECT & PROPAGATE ---
            final String validatedToken = token;
            return identityService.introspect(validatedToken)
                    .flatMap(introspectResponse -> {
                        if (introspectResponse.isValid()) {
                            // HEADER PROPAGATION: Inject the "Authorization: Bearer" header
                            // into the downstream request so microservices (wallet-service,
                            // transaction-service, etc.) don't need any code changes.
                            ServerWebExchange mutatedExchange = exchange.mutate()
                                    .request(r -> r.header(HttpHeaders.AUTHORIZATION, "Bearer " + validatedToken))
                                    .build();
                            return chain.filter(mutatedExchange);
                        } else {
                            return onError(exchange, "Invalid Token", HttpStatus.UNAUTHORIZED);
                        }
                    })
                    .onErrorResume(throwable -> {
                        log.error("GATEWAY: Error calling Identity Service", throwable);
                        return onError(exchange, "Identity Service Unreachable", HttpStatus.UNAUTHORIZED);
                    });
        };
    }

    private boolean isPublicEndpoint(String path, HttpMethod method) {
        // Danh sách các API không cần token
        // Match chính xác các route
        if (pathMatcher.match("/identity/auth/token", path) ||
            pathMatcher.match("/identity/auth/google", path) ||
            pathMatcher.match("/identity/auth/introspect", path) ||
            pathMatcher.match("/identity/auth/logout", path) ||
            pathMatcher.match("/identity/auth/refresh", path) ||
            pathMatcher.match("/identity/auth/forgot-password", path) ||
            pathMatcher.match("/identity/auth/reset-password", path)) {
            return true;
        }
        
        // Match riêng cho Register (chỉ POST /identity/users)
        if (pathMatcher.match("/identity/users", path) && HttpMethod.POST.equals(method)) {
            return true;
        }

        return false;
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
