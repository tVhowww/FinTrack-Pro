package com.fintrack.transaction_service.service;

import com.fintrack.transaction_service.entity.ExchangeRate;
import com.fintrack.transaction_service.repository.ExchangeRateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CurrencyConverterService {

    private final ExchangeRateRepository exchangeRateRepository;

    /**
     * Hàm quy đổi tiền tệ vạn năng
     * @param amount Số tiền cần đổi
     * @param fromCurrency Đồng tiền gốc (VD: USD)
     * @param toCurrency Đồng tiền muốn đổi sang (VD: VND)
     * @return Số tiền sau khi quy đổi
     */
    public BigDecimal convertCurrency(BigDecimal amount, String fromCurrency, String toCurrency) {
        // 0. Kiểm tra an toàn: Nếu số tiền là null, hoặc 2 đồng tiền giống nhau thì trả về y nguyên
        if (amount == null || amount.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        if (fromCurrency == null || toCurrency == null || fromCurrency.equalsIgnoreCase(toCurrency)) {
            return amount;
        }

        fromCurrency = fromCurrency.toUpperCase();
        toCurrency = toCurrency.toUpperCase();

        // 1. Tìm tỷ giá trực tiếp (VD: Có sẵn cặp USD -> VND trong DB)
        Optional<ExchangeRate> directRate = exchangeRateRepository.findByBaseCurrencyAndTargetCurrency(fromCurrency, toCurrency);
        if (directRate.isPresent()) {
            return amount.multiply(directRate.get().getRate());
        }

        // 2. Tìm tỷ giá ngược chiều (Phòng hờ DB chỉ lưu VND -> USD, thì mình lấy 1 chia cho tỷ giá đó)
        Optional<ExchangeRate> reverseRate = exchangeRateRepository.findByBaseCurrencyAndTargetCurrency(toCurrency, fromCurrency);
        if (reverseRate.isPresent() && reverseRate.get().getRate().compareTo(BigDecimal.ZERO) != 0) {
            // Dùng RoundingMode.HALF_UP để làm tròn chuẩn tài chính (làm tròn lên nếu phần thập phân >= 5)
            return amount.divide(reverseRate.get().getRate(), 2, RoundingMode.HALF_UP);
        }

        // 3. Fallback (Bước đường cùng): Nếu DB hoàn toàn không có dữ liệu về 2 đồng tiền này
        log.warn("Không tìm thấy tỷ giá quy đổi từ {} sang {}. Tạm thời giữ nguyên giá trị gốc!", fromCurrency, toCurrency);
        return amount;
    }
}