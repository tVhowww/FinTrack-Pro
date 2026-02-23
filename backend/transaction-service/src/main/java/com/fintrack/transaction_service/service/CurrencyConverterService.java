package com.fintrack.transaction_service.service;

import com.fintrack.transaction_service.entity.ExchangeRate;
import com.fintrack.transaction_service.repository.ExchangeRateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CurrencyConverterService {

    private final ExchangeRateRepository exchangeRateRepository;

    private final StringRedisTemplate redisTemplate;

    /**
     * Hàm quy đổi tiền tệ vạn năng (Đã tích hợp Redis Cache)
     */
    public BigDecimal convertCurrency(BigDecimal amount, String fromCurrency, String toCurrency) {
        // 0. Kiểm tra an toàn
        if (amount == null || amount.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        if (fromCurrency == null || toCurrency == null || fromCurrency.equalsIgnoreCase(toCurrency)) {
            return amount;
        }

        fromCurrency = fromCurrency.toUpperCase();
        toCurrency = toCurrency.toUpperCase();

        // ==========================================
        // TẦNG 1: TÌM TRÊN REDIS (SIÊU TỐC)
        // ==========================================
        try {
            // 1.1 Tìm tỷ giá thuận (VD: USD -> VND)
            String redisKeyDirect = "exchange_rates:" + fromCurrency;
            Object directRateObj = redisTemplate.opsForHash().get(redisKeyDirect, toCurrency);
            if (directRateObj != null) {
                BigDecimal rate = new BigDecimal(directRateObj.toString());
                return amount.multiply(rate);
            }

            // 1.2 Tìm tỷ giá nghịch (VD: VND -> USD)
            String redisKeyReverse = "exchange_rates:" + toCurrency;
            Object reverseRateObj = redisTemplate.opsForHash().get(redisKeyReverse, fromCurrency);
            if (reverseRateObj != null) {
                BigDecimal rate = new BigDecimal(reverseRateObj.toString());
                if (rate.compareTo(BigDecimal.ZERO) != 0) {
                    return amount.divide(rate, 2, RoundingMode.HALF_UP);
                }
            }
        } catch (Exception e) {
            log.warn("Lỗi khi đọc tỷ giá từ Redis, sẽ chuyển sang dùng Database: {}", e.getMessage());
        }

        // ==========================================
        // TẦNG 2: TÌM TRONG DATABASE (CHẬM HƠN - FALLBACK)
        // ==========================================
        // Nếu code chạy xuống được đây nghĩa là Redis không có dữ liệu (Cache Miss)

        // 2.1 Tìm tỷ giá thuận
        Optional<ExchangeRate> directRate = exchangeRateRepository.findByBaseCurrencyAndTargetCurrency(fromCurrency, toCurrency);
        if (directRate.isPresent()) {
            return amount.multiply(directRate.get().getRate());
        }

        // 2.2 Tìm tỷ giá nghịch
        Optional<ExchangeRate> reverseRate = exchangeRateRepository.findByBaseCurrencyAndTargetCurrency(toCurrency, fromCurrency);
        if (reverseRate.isPresent() && reverseRate.get().getRate().compareTo(BigDecimal.ZERO) != 0) {
            return amount.divide(reverseRate.get().getRate(), 2, RoundingMode.HALF_UP);
        }

        // 3. Fallback (Bước đường cùng)
        log.warn("Không tìm thấy tỷ giá quy đổi từ {} sang {} ở cả Redis và DB. Tạm thời giữ nguyên giá trị gốc!", fromCurrency, toCurrency);
        return amount;
    }
}