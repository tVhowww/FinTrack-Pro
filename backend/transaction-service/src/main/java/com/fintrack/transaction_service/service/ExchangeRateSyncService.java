package com.fintrack.transaction_service.service;

import com.fintrack.transaction_service.dto.response.ExchangeRateApiResponse;
import com.fintrack.transaction_service.entity.ExchangeRate;
import com.fintrack.transaction_service.repository.ExchangeRateRepository;
import com.fintrack.transaction_service.repository.httpclient.ExchangeRateClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExchangeRateSyncService {

    private final ExchangeRateClient exchangeRateClient;
    private final ExchangeRateRepository exchangeRateRepository;
    private final StringRedisTemplate redisTemplate;

    // Chạy lúc 00:00 mỗi ngày. (Nếu muốn test chạy mỗi phút 1 lần thì dùng: "0 * * * * ?")
    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void syncDailyExchangeRates() {
        log.info("Bắt đầu đồng bộ tỷ giá hối đoái...");

        // Danh sách các đồng tiền gốc (Base Currency) mà hệ thống mình quan tâm
        List<String> baseCurrencies = Arrays.asList("VND", "USD", "EUR");

        for (String base : baseCurrencies) {
            try {
                // Gọi API lấy tỷ giá
                ExchangeRateApiResponse response = exchangeRateClient.getLatestRates(base);

                if ("success".equals(response.getResult()) && response.getConversionRates() != null) {
                    Map<String, BigDecimal> rates = response.getConversionRates();

                    Map<String, String> redisRatesMap = new HashMap<>();

                    // Lặp qua tất cả các tỷ giá lấy được và lưu vào DB
                    rates.forEach((targetCurrency, rateValue) -> {
                        // Tìm trong DB xem đã có tỷ giá cặp này chưa
                        ExchangeRate exchangeRate = exchangeRateRepository
                                .findByBaseCurrencyAndTargetCurrency(base, targetCurrency)
                                .orElse(ExchangeRate.builder()
                                        .baseCurrency(base)
                                        .targetCurrency(targetCurrency)
                                        .build()); // Chưa có thì tạo mới

                        // Cập nhật tỷ giá và thời gian mới nhất
                        exchangeRate.setRate(rateValue);
                        exchangeRate.setLastUpdated(Instant.now());

                        exchangeRateRepository.save(exchangeRate);

                        redisRatesMap.put(targetCurrency, rateValue.toString());
                    });

                    String redisKey = "exchange_rates:" + base;
                    redisTemplate.opsForHash().putAll(redisKey, redisRatesMap);

                    // Set TTL 25 tiếng (đề phòng hôm sau job chạy trễ 1 chút vẫn có data backup)
                    redisTemplate.expire(redisKey, 25, TimeUnit.HOURS);

                    log.info("Đã cập nhật thành công tỷ giá cho đồng: {}", base);
                }
            } catch (Exception e) {
                log.error("Lỗi khi đồng bộ tỷ giá cho đồng {}: {}", base, e.getMessage());
            }
        }
        log.info("Hoàn tất tiến trình đồng bộ tỷ giá!");
    }

    @EventListener(ApplicationReadyEvent.class)
    public void syncOnStartup() {
        log.info("App vừa khởi động, tiến hành lấy tỷ giá mới nhất ngay cho nóng!");
        syncDailyExchangeRates();
    }
}