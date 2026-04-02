package com.fintrack.transaction_service.service.transaction;

import com.fintrack.transaction_service.dto.response.*;
import com.fintrack.transaction_service.entity.Category;
import com.fintrack.transaction_service.entity.Transaction;
import com.fintrack.transaction_service.enums.TransactionType;
import com.fintrack.transaction_service.mapper.TransactionMapper;
import com.fintrack.transaction_service.repository.TransactionRepository;
import com.fintrack.transaction_service.repository.httpclient.IdentityClient;
import com.fintrack.transaction_service.repository.httpclient.WalletClient;
import com.fintrack.transaction_service.repository.specification.TransactionSpecification;
import com.fintrack.transaction_service.service.currency.CurrencyConverterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionStatisticsService {
    private final TransactionRepository transactionRepository;
    private final TransactionMapper transactionMapper;
    private final CurrencyConverterService currencyConverterService;
    private final WalletClient walletClient;
    private final IdentityClient identityClient;

    // Inject QueryService để lấy ds Ví
    private final TransactionQueryService queryService;

    public BigDecimal getTotalBalance() {
        String baseCurrency = getUserBaseCurrency();
        BigDecimal totalBalance = BigDecimal.ZERO;
        try {
            var response = walletClient.getMyWallets();
            if (response != null && response.getResult() != null) {
                for (var wallet : response.getResult()) {
                    BigDecimal converted = currencyConverterService.convertCurrency(wallet.getBalance(), wallet.getCurrency(), baseCurrency);
                    totalBalance = totalBalance.add(converted);
                }
            }
        } catch (Exception e) { log.error("Lỗi lấy tổng số dư: {}", e.getMessage()); }
        return totalBalance;
    }

    public List<TransactionResponse> getHighestExpenses(String walletId, int month, int year) {
        List<String> walletIds = queryService.resolveWalletIds(walletId);
        if (walletIds.isEmpty()) return new ArrayList<>();

        String baseCurrency = getUserBaseCurrency();
        Map<String, String> walletCurrencyMap = getWalletCurrencyMap();

        YearMonth yearMonth = YearMonth.of(year, month);
        Instant start = yearMonth.atDay(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant end = yearMonth.atEndOfMonth().atTime(23, 59, 59).atZone(ZoneId.systemDefault()).toInstant();

        Specification<Transaction> spec = Specification.where(TransactionSpecification.hasWalletIdIn(walletIds))
                .and(TransactionSpecification.hasType(TransactionType.EXPENSE))
                .and(TransactionSpecification.createdBetween(start, end))
                .and(TransactionSpecification.isNotTransfer());

        return transactionRepository.findAll(spec).stream()
                .sorted((t1, t2) -> {
                    String c1 = walletCurrencyMap.getOrDefault(t1.getWalletId(), "VND");
                    String c2 = walletCurrencyMap.getOrDefault(t2.getWalletId(), "VND");
                    BigDecimal conv1 = currencyConverterService.convertCurrency(t1.getAmount().abs(), c1, baseCurrency);
                    BigDecimal conv2 = currencyConverterService.convertCurrency(t2.getAmount().abs(), c2, baseCurrency);
                    return conv2.compareTo(conv1);
                })
                .limit(5)
                .map(transactionMapper::toTransactionResponse).toList();
    }

    public List<BalanceTrendResponse> getBalanceTrend(String walletId) {
        List<String> walletIds = queryService.resolveWalletIds(walletId);
        if (walletIds.isEmpty()) return new ArrayList<>();

        String baseCurrency = getUserBaseCurrency();
        Map<String, String> walletCurrencyMap = getWalletCurrencyMap();
        List<BalanceTrendResponse> trends = new ArrayList<>();
        YearMonth currentMonth = YearMonth.now();

        for (int i = 5; i >= 0; i--) {
            YearMonth targetMonth = currentMonth.minusMonths(i);
            Instant start = targetMonth.atDay(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
            Instant end = targetMonth.atEndOfMonth().atTime(23, 59, 59).atZone(ZoneId.systemDefault()).toInstant();

            Specification<Transaction> spec = Specification.where(TransactionSpecification.hasWalletIdIn(walletIds))
                    .and(TransactionSpecification.createdBetween(start, end))
                    .and(TransactionSpecification.isNotTransfer());
            List<Transaction> transactions = transactionRepository.findAll(spec);

            BigDecimal mIncome = BigDecimal.ZERO;
            BigDecimal mExpense = BigDecimal.ZERO;

            for (Transaction tx : transactions) {
                String txCurrency = walletCurrencyMap.getOrDefault(tx.getWalletId(), "VND");
                BigDecimal converted = currencyConverterService.convertCurrency(tx.getAmount().abs(), txCurrency, baseCurrency);
                if (tx.getType() == TransactionType.INCOME) mIncome = mIncome.add(converted);
                else if (tx.getType() == TransactionType.EXPENSE) mExpense = mExpense.add(converted);
            }

            trends.add(BalanceTrendResponse.builder().month(targetMonth.getMonthValue()).year(targetMonth.getYear())
                    .income(mIncome).expense(mExpense).netSavings(mIncome.subtract(mExpense)).build());
        }
        return trends;
    }

    public List<ExpenseStructureResponse> getExpenseStructure(String walletId, int month, int year) {
        List<String> walletIds = queryService.resolveWalletIds(walletId);
        if (walletIds.isEmpty()) return new ArrayList<>();

        String baseCurrency = getUserBaseCurrency();
        Map<String, String> walletCurrencyMap = getWalletCurrencyMap();
        YearMonth yearMonth = YearMonth.of(year, month);
        Instant start = yearMonth.atDay(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant end = yearMonth.atEndOfMonth().atTime(23, 59, 59).atZone(ZoneId.systemDefault()).toInstant();

        Specification<Transaction> spec = Specification.where(TransactionSpecification.hasWalletIdIn(walletIds))
                .and(TransactionSpecification.hasType(TransactionType.EXPENSE))
                .and(TransactionSpecification.createdBetween(start, end))
                .and(TransactionSpecification.isNotTransfer());

        List<Transaction> transactions = transactionRepository.findAll(spec);
        java.util.Map<Category, BigDecimal> categorySums = new java.util.HashMap<>();
        BigDecimal totalExpense = BigDecimal.ZERO;

        for (Transaction tx : transactions) {
            String txCurrency = walletCurrencyMap.getOrDefault(tx.getWalletId(), "VND");
            BigDecimal converted = currencyConverterService.convertCurrency(tx.getAmount().abs(), txCurrency, baseCurrency);
            totalExpense = totalExpense.add(converted);
            categorySums.put(tx.getCategory(), categorySums.getOrDefault(tx.getCategory(), BigDecimal.ZERO).add(converted));
        }

        List<ExpenseStructureResponse> result = new ArrayList<>();
        for (Map.Entry<Category, BigDecimal> entry : categorySums.entrySet()) {
            Category category = entry.getKey();
            BigDecimal amount = entry.getValue();
            double percentage = totalExpense.compareTo(BigDecimal.ZERO) > 0 ? amount.divide(totalExpense, 4, RoundingMode.HALF_UP).doubleValue() * 100 : 0;
            result.add(ExpenseStructureResponse.builder()
                    .categoryId(category != null ? category.getId() : "uncategorized")
                    .categoryName(category != null ? category.getName() : "Khác")
                    .amount(amount).percentage(percentage).build());
        }
        result.sort((a, b) -> b.getAmount().compareTo(a.getAmount()));
        return result;
    }

    public MonthlyStatisticsResponse getMonthlyStatistics(String walletId, int month, int year) {
        List<String> walletIds = queryService.resolveWalletIds(walletId);
        if (walletIds.isEmpty()) return MonthlyStatisticsResponse.builder().month(month).year(year).totalIncome(BigDecimal.ZERO).totalExpense(BigDecimal.ZERO).netSavings(BigDecimal.ZERO).build();

        String baseCurrency = getUserBaseCurrency();
        Map<String, String> walletCurrencyMap = getWalletCurrencyMap();
        YearMonth yearMonth = YearMonth.of(year, month);
        Instant start = yearMonth.atDay(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant end = yearMonth.atEndOfMonth().atTime(23, 59, 59).atZone(ZoneId.systemDefault()).toInstant();

        Specification<Transaction> spec = Specification.where(TransactionSpecification.hasWalletIdIn(walletIds))
                .and(TransactionSpecification.createdBetween(start, end))
                .and(TransactionSpecification.isNotTransfer());
        List<Transaction> transactions = transactionRepository.findAll(spec);

        BigDecimal totalIncome = BigDecimal.ZERO, totalExpense = BigDecimal.ZERO;
        for (Transaction tx : transactions) {
            String txCurrency = walletCurrencyMap.getOrDefault(tx.getWalletId(), "VND");
            BigDecimal convertedAmount = currencyConverterService.convertCurrency(tx.getAmount().abs(), txCurrency, baseCurrency);
            if (tx.getType() == TransactionType.INCOME) totalIncome = totalIncome.add(convertedAmount);
            else if (tx.getType() == TransactionType.EXPENSE) totalExpense = totalExpense.add(convertedAmount);
        }

        return MonthlyStatisticsResponse.builder().month(month).year(year).totalIncome(totalIncome).totalExpense(totalExpense).netSavings(totalIncome.subtract(totalExpense)).build();
    }

    private String getUserBaseCurrency() {
        try {
            var userResponse = identityClient.getMyInfo();
            if (userResponse != null && userResponse.getResult() != null && userResponse.getResult().getBaseCurrency() != null) return userResponse.getResult().getBaseCurrency();
        } catch (Exception e) { log.error("Lỗi lấy Base Currency", e); }
        return "VND";
    }

    private Map<String, String> getWalletCurrencyMap() {
        Map<String, String> map = new java.util.HashMap<>();
        try {
            var response = walletClient.getMyWallets();
            if (response != null && response.getResult() != null) {
                for (var w : response.getResult()) map.put(w.getId(), w.getCurrency());
            }
        } catch (Exception e) { log.error("Lỗi map tiền tệ", e); }
        return map;
    }
}