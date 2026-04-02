package com.fintrack.transaction_service.service;

import com.fintrack.transaction_service.dto.request.TransactionCreationRequest;
import com.fintrack.transaction_service.dto.request.WalletBalanceUpdateRequest;
import com.fintrack.transaction_service.dto.response.TransactionResponse;
import com.fintrack.transaction_service.entity.Transaction;
import com.fintrack.transaction_service.enums.TransactionType;
import com.fintrack.transaction_service.mapper.TransactionMapper;
import com.fintrack.transaction_service.repository.TransactionRepository;
import com.fintrack.transaction_service.repository.httpclient.WalletClient;
import com.fintrack.transaction_service.service.transaction.TransactionCommandService;
import com.fintrack.transaction_service.service.transaction.TransactionQueryService;
import com.fintrack.transaction_service.repository.httpclient.IdentityClient;
import com.fintrack.transaction_service.service.budget.BudgetAlertEngine;
import com.fintrack.transaction_service.service.transaction.TransactionNotificationWorker;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.*;

@ExtendWith(MockitoExtension.class)
public class TransactionCommandServiceTest {

    @Mock private TransactionRepository transactionRepository;
    @Mock private TransactionMapper transactionMapper;
    @Mock private WalletClient walletClient;

    // --- CÁC MOCK MỚI THÊM VÀO CHO CHUẨN SRP ---
    @Mock private TransactionQueryService queryService;
    @Mock private StringRedisTemplate redisTemplate;
    @Mock private ValueOperations<String, String> valueOperations;
    @Mock private IdentityClient identityClient;
    @Mock private BudgetAlertEngine budgetAlertEngine;
    @Mock private TransactionNotificationWorker notificationWorker;

    @InjectMocks
    private TransactionCommandService commandService; // Trỏ vào Service mới

    private TransactionCreationRequest request;
    private TransactionResponse response;
    private Transaction transaction;

    @BeforeEach
    void setUp() {
        request = TransactionCreationRequest.builder()
                .walletId("wallet-456")
                .amount(BigDecimal.valueOf(100000))
                .type(TransactionType.EXPENSE)
                .build();

        transaction = Transaction.builder()
                .id("trans-789")
                .amount(BigDecimal.valueOf(100000))
                .build();

        response = TransactionResponse.builder()
                .id("trans-789")
                .amount(BigDecimal.valueOf(100000))
                .build();
    }

    @Test
    @DisplayName("Create Transaction: Should convert amount to negative if type is EXPENSE")
    void createTransaction_Expense_Success() {
        // Mock Redis (Tránh lỗi Double Click)
        Mockito.when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        Mockito.when(valueOperations.setIfAbsent(any(), any(), anyLong(), any())).thenReturn(true);

        // Mock QueryService (Bỏ qua đoạn Check Ví của user)
        Mockito.when(queryService.validateAndGetWallet(any())).thenReturn(null);

        Mockito.when(transactionMapper.toTransaction(any())).thenReturn(transaction);
        Mockito.when(transactionRepository.save(any())).thenReturn(transaction);
        Mockito.when(transactionMapper.toTransactionResponse(any())).thenReturn(response);

        // Gọi hàm của thằng CommandService
        var result = commandService.create(request);

        ArgumentCaptor<WalletBalanceUpdateRequest> captor = ArgumentCaptor.forClass(WalletBalanceUpdateRequest.class);
        Mockito.verify(walletClient).updateBalance(Mockito.eq("wallet-456"), captor.capture());

        BigDecimal sentAmount = captor.getValue().getAmount();
        Assertions.assertEquals(BigDecimal.valueOf(-100000), sentAmount);
        Mockito.verify(transactionRepository).save(any());
        Assertions.assertNotNull(result);
        Assertions.assertEquals("trans-789", result.getId());
    }

    @Test
    @DisplayName("Create Transaction: Should keep positive amount if type is INCOME")
    void createTransaction_Income_Success() {
        request.setType(TransactionType.INCOME);

        // Phải mock lại Redis và QueryService cho Test Case này
        Mockito.when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        Mockito.when(valueOperations.setIfAbsent(any(), any(), anyLong(), any())).thenReturn(true);
        Mockito.when(queryService.validateAndGetWallet(any())).thenReturn(null);

        Mockito.when(transactionMapper.toTransaction(any())).thenReturn(transaction);
        Mockito.when(transactionRepository.save(any())).thenReturn(transaction);
        Mockito.when(transactionMapper.toTransactionResponse(any())).thenReturn(response);

        commandService.create(request);

        ArgumentCaptor<WalletBalanceUpdateRequest> captor = ArgumentCaptor.forClass(WalletBalanceUpdateRequest.class);
        Mockito.verify(walletClient).updateBalance(Mockito.eq("wallet-456"), captor.capture());

        BigDecimal sentAmount = captor.getValue().getAmount();
        Assertions.assertEquals(BigDecimal.valueOf(100000), sentAmount);
    }
}