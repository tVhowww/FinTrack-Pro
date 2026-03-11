package com.fintrack.transaction_service.repository;

import com.fintrack.transaction_service.entity.ExchangeRate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ExchangeRateRepository extends JpaRepository<ExchangeRate, String> {

    // Hàm lấy tỷ giá quy đổi
    // Ví dụ: Tìm tỷ giá từ USD sang VND
    Optional<ExchangeRate> findByBaseCurrencyAndTargetCurrency(String baseCurrency, String targetCurrency);
}