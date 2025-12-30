package com.fintrack.api_gateway.service;

import com.fintrack.api_gateway.dto.request.IntrospectRequest;
import com.fintrack.api_gateway.dto.response.ApiResponse;
import com.fintrack.api_gateway.dto.response.IntrospectResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class IdentityService {
    private final WebClient webClient;

    public Mono<IntrospectResponse> introspect(String token) {
        return webClient.post()
                .uri("/identity/auth/introspect")
                .bodyValue(new IntrospectRequest(token))
                .retrieve()
                // Dùng ParameterizedTypeReference để Jackson hiểu được Generic <IntrospectResponse>
                .bodyToMono(new ParameterizedTypeReference<ApiResponse<IntrospectResponse>>() {})
                .map(ApiResponse::getResult);
    }
}
