package com.fintrack.identity_service.configuration;

import com.fintrack.identity_service.dto.response.ApiResponse;
import com.fintrack.identity_service.exception.ErrorCode;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import tools.jackson.databind.ObjectMapper;

import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Value("${jwt.signerKey}")
    private String signerKey;

    // 1. Định nghĩa các đường dẫn được phép truy cập không cần login
    private final String[] PUBLIC_ENDPOINTS = {
            "/auth/token", "/auth/introspect", "/auth/logout",
            "/auth/refresh", "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html"
    };

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity httpSecurity) throws Exception {
        httpSecurity
                // Tắt chức năng CSRF (vì chúng ta dùng API stateless, không dùng Session cookie)
                .csrf(AbstractHttpConfigurer::disable)

                // Phân quyền request
                .authorizeHttpRequests(request -> request
                        // Cho phép các endpoint trong danh sách PUBLIC
                        .requestMatchers(PUBLIC_ENDPOINTS).permitAll()

                        // Cho phép tạo user mới (POST /users) mà không cần token (Sign up)
                        .requestMatchers(HttpMethod.POST, "/users").permitAll()

                        .requestMatchers(HttpMethod.GET, "/users").hasAuthority("SCOPE_ADMIN")

                        // Các request khác đều cần phải xác thực (login)
                        .anyRequest().authenticated()
                );

        httpSecurity.oauth2ResourceServer(oauth2 ->
                oauth2.jwt(jwtConfigurer -> jwtConfigurer.decoder(jwtDecoder()))
                        .authenticationEntryPoint(new JwtAuthenticationEntryPoint())
        );

        return httpSecurity.build();
    }

    public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

        @Override
        public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException) throws IOException, ServletException {
            ErrorCode errorCode = ErrorCode.UNAUTHENTICATED;

            response.setStatus(errorCode.getCode());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);

            ApiResponse<?> apiResponse = ApiResponse.builder()
                    .code(errorCode.getCode())
                    .message(errorCode.getMessage())
                    .build();

            ObjectMapper objectMapper = new ObjectMapper();

            response.getWriter().write(objectMapper.writeValueAsString(apiResponse));
            response.flushBuffer();
        }
    }

    @Bean
    JwtDecoder jwtDecoder() {
        // Tạo SecretKeySpec từ chuỗi signerKey của chúng ta
        SecretKeySpec secretKeySpec = new SecretKeySpec(signerKey.getBytes(), "HS512");

        // Cấu hình Decoder sử dụng thuật toán HS512 và Key bí mật
        return NimbusJwtDecoder
                .withSecretKey(secretKeySpec)
                .macAlgorithm(MacAlgorithm.HS512)
                .build();

    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10); // Độ mạnh của mã hóa là 10
    }
}
