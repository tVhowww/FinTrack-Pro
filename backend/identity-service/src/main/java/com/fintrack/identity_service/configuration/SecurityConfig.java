package com.fintrack.identity_service.configuration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    // 1. Định nghĩa các đường dẫn được phép truy cập không cần login
    private final String[] PUBLIC_ENDPOINTS = {
        "/users"
    };

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity httpSecurity) throws Exception {
        httpSecurity
                // Tắt chức năng CSRF (vì chúng ta dùng API stateless, không dùng Session cookie)
                .csrf(AbstractHttpConfigurer::disable)

                // Phân quyền request
                .authorizeHttpRequests(request -> request
                        // Cho phép POST vào /users (Đăng ký) mà không cần login)
                        .requestMatchers(HttpMethod.POST, PUBLIC_ENDPOINTS).permitAll()
                        // Các request khác đều cần phải xác thực (login)
                        .anyRequest().authenticated()
                );

        return httpSecurity.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10); // Độ mạnh của mã hóa là 10
    }
}
