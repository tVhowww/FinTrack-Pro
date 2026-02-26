package com.fintrack.identity_service.configuration;


import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;

import javax.crypto.spec.SecretKeySpec;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    private final StringRedisTemplate redisTemplate;

    @Value("${jwt.signerKey}")
    private String signerKey;

    // 1. Định nghĩa các đường dẫn được phép truy cập không cần login
    private final String[] PUBLIC_ENDPOINTS = {
            "/auth/token", "/auth/introspect", "/auth/logout",
            "/auth/refresh", "/auth/reset-password", "/auth/forgot-password", "/auth/google", "/v3/api-docs/**",
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

                        // Các request khác đều cần phải xác thực (login)
                        .anyRequest().authenticated()
                );

        httpSecurity.oauth2ResourceServer(oauth2 ->
                oauth2.jwt(jwtConfigurer -> jwtConfigurer.decoder(jwtDecoder()))
                        .authenticationEntryPoint(new JwtAuthenticationEntryPoint())
        );

        return httpSecurity.build();
    }

    @Bean
    JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter grantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
        // Set prefix là rỗng (mặc định nó là "SCOPE_")
        // Vì trong Token ta đã tự build chữ "ROLE_" rồi, nên giờ lấy y nguyên là được
        grantedAuthoritiesConverter.setAuthorityPrefix("");

        JwtAuthenticationConverter jwtAuthenticationConverter = new JwtAuthenticationConverter();
        jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(grantedAuthoritiesConverter);
        return jwtAuthenticationConverter;
    }

    @Bean
    JwtDecoder jwtDecoder() {
        SecretKeySpec secretKeySpec = new SecretKeySpec(signerKey.getBytes(), "HS512");

        // Tạo decoder chuẩn của Nimbus (để verify chữ ký và hạn dùng trước)
        NimbusJwtDecoder nimbusJwtDecoder = NimbusJwtDecoder
                .withSecretKey(secretKeySpec)
                .macAlgorithm(MacAlgorithm.HS512)
                .build();

        // Trả về một chức năng lồng ghép (Wrapper)
        return token -> {
            // Bước 1: Verify token theo chuẩn (Check chữ ký, hết hạn chưa)
            // Nếu sai chữ ký hoặc hết hạn, nimbus sẽ tự throw Exception ở đây
            Jwt jwt = nimbusJwtDecoder.decode(token);

            // Bước 2: Check xem token ID (JTI) có nằm trong "Sổ đen" (Database) không
            String redisKey = "jwt_blacklist:" + jwt.getId();
            if (Boolean.TRUE.equals(redisTemplate.hasKey(redisKey))) {
                // Nếu có trong Redis -> Báo lỗi ngay lập tức
                throw new BadJwtException("Token has been logged out or invalidated");
            }

            // Nếu mọi thứ ok -> Trả về thông tin token
            return jwt;
        };
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10); // Độ mạnh của mã hóa là 10
    }
}
