package com.fintrack.transaction_service.service;

import com.fintrack.transaction_service.dto.request.TransactionCreationRequest;
import com.fintrack.transaction_service.dto.request.WalletBalanceUpdateRequest;
import com.fintrack.transaction_service.dto.response.TransactionResponse;
import com.fintrack.transaction_service.entity.Transaction;
import com.fintrack.transaction_service.enums.TransactionType;
import com.fintrack.transaction_service.mapper.TransactionMapper;
import com.fintrack.transaction_service.repository.TransactionRepository;
import com.fintrack.transaction_service.repository.httpclient.WalletClient;
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

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.any;

@ExtendWith(MockitoExtension.class)
public class TransactionServiceTest {
    @Mock
    private TransactionRepository transactionRepository;
    @Mock
    private TransactionMapper transactionMapper;
    @Mock
    private WalletClient walletClient;

    @InjectMocks
    private TransactionService transactionService;

    private TransactionCreationRequest request;
    private TransactionResponse response;
    private Transaction transaction;

    @BeforeEach
    void setUp() {
        request = TransactionCreationRequest.builder()
                .walletId("wallet-456")
                .amount(BigDecimal.valueOf(100000)) // 100k
                .type(TransactionType.EXPENSE) // Loại Chi tiêu
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
        // 1. GIVEN (Giả lập hành vi của các dependencies)
        // Khi mapper được gọi -> trả về entity transaction mẫu
        Mockito.when(transactionMapper.toTransaction(any())).thenReturn(transaction);
        // Khi repository save -> trả về entity transaction mẫu
        Mockito.when(transactionRepository.save(any())).thenReturn(transaction);
        // Khi mapper map sang response -> trả về response mẫu
        Mockito.when(transactionMapper.toTransactionResponse(any())).thenReturn(response);

        // 2. WHEN (Gọi hàm cần test)
        var result = transactionService.create(request);

        // 3. THEN (Kiểm tra kết quả)

        // Kiểm tra logic quan trọng nhất: Gọi sang Wallet phải là số ÂM (-100,000)
        // Dùng ArgumentCaptor để "bắt" lấy tham số đã truyền vào hàm updateBalance
        ArgumentCaptor<WalletBalanceUpdateRequest> captor = ArgumentCaptor.forClass(WalletBalanceUpdateRequest.class);

        // Verify: Hàm updateBalance phải được gọi 1 lần với đúng walletId và captor
        Mockito.verify(walletClient).updateBalance(Mockito.eq("wallet-456"), captor.capture());

        // Lấy giá trị đã bắt được để kiểm tra
        BigDecimal sentAmount = captor.getValue().getAmount();
        Assertions.assertEquals(BigDecimal.valueOf(-100000), sentAmount);

        // Verify: Repository phải được gọi save
        Mockito.verify(transactionRepository).save(any());

        // Verify: Kết quả trả về không null
        Assertions.assertNotNull(result);
        Assertions.assertEquals("trans-789", result.getId());
    }

    @Test
    @DisplayName("Create Transaction: Should keep positive amount if type is INCOME")
    void createTransaction_Income_Success() {
        // 1. GIVEN
        request.setType(TransactionType.INCOME); // Đổi thành Thu nhập

        Mockito.when(transactionMapper.toTransaction(any())).thenReturn(transaction);
        Mockito.when(transactionRepository.save(any())).thenReturn(transaction);
        Mockito.when(transactionMapper.toTransactionResponse(any())).thenReturn(response);

        // 2. WHEN
        transactionService.create(request);

        // 3. THEN
        ArgumentCaptor<WalletBalanceUpdateRequest> captor = ArgumentCaptor.forClass(WalletBalanceUpdateRequest.class);
        Mockito.verify(walletClient).updateBalance(Mockito.eq("wallet-456"), captor.capture());

        BigDecimal sentAmount = captor.getValue().getAmount();
        // Thu nhập thì phải giữ nguyên số dương (100,000)
        Assertions.assertEquals(BigDecimal.valueOf(100000), sentAmount);
    }
}
