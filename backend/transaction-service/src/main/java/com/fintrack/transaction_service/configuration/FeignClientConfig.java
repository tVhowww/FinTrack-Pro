package com.fintrack.transaction_service.configuration;

import feign.RequestInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FeignClientConfig {

    // Đăng ký AuthenticationRequestInterceptor (Cái chuyển tiếp Token)
    @Bean
    public RequestInterceptor authInterceptor() {
        return new AuthenticationRequestInterceptor();
    }

    // Lưu ý: Class InternalKeyInterceptor của bạn đã có @Component nên nó tự chạy global.
    // Nhưng nếu muốn chắc ăn gom về 1 mối, bạn có thể bỏ @Component ở class kia
    // và khai báo @Bean ở đây luôn cũng được.
}