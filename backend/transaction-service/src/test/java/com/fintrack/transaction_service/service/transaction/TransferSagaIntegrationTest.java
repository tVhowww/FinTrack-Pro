package com.fintrack.transaction_service.service.transaction;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fintrack.transaction_service.dto.event.TransferResultEvent;
import com.fintrack.transaction_service.dto.request.TransferRequest;
import com.fintrack.transaction_service.dto.response.ApiResponse;
import com.fintrack.transaction_service.dto.response.TransactionResponse;
import com.fintrack.transaction_service.dto.response.UserResponse;
import com.fintrack.transaction_service.dto.response.WalletResponse;
import com.fintrack.transaction_service.entity.Category;
import com.fintrack.transaction_service.entity.Transaction;
import com.fintrack.transaction_service.enums.TransactionType;
import com.fintrack.transaction_service.event.consumer.TransferSagaListener;
import com.fintrack.transaction_service.repository.CategoryRepository;
import com.fintrack.transaction_service.repository.TransactionRepository;
import com.fintrack.transaction_service.repository.httpclient.IdentityClient;
import com.fintrack.transaction_service.repository.httpclient.WalletClient;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.math.BigDecimal;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;

@SpringBootTest
@ActiveProfiles("test")
public class TransferSagaIntegrationTest {

    @Autowired
    private TransactionCommandService transactionCommandService;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private TransferSagaListener transferSagaListener;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    // --- Mock External Infrastructure Beans ---
    @MockitoBean
    private WalletClient walletClient;

    @MockitoBean
    private IdentityClient identityClient;

    @MockitoBean
    private KafkaTemplate<String, Object> kafkaTemplate;

    @MockitoBean
    private StringRedisTemplate redisTemplate;

    private ValueOperations<String, String> valueOperations;

    private WalletResponse sourceWallet;
    private WalletResponse targetWallet;

    @BeforeEach
    void setUp() {
        valueOperations = Mockito.mock(ValueOperations.class);
        jdbcTemplate.execute("DELETE FROM transactions");
        jdbcTemplate.execute("DELETE FROM categories");

        // Ví nguồn
        sourceWallet = WalletResponse.builder()
                .id("wallet-source")
                .name("Ví nguồn")
                .balance(BigDecimal.valueOf(1000000))
                .currency("VND")
                .userId("user-123")
                .type("BASIC")
                .build();

        // Ví đích
        targetWallet = WalletResponse.builder()
                .id("wallet-target")
                .name("Ví đích")
                .balance(BigDecimal.valueOf(500000))
                .currency("VND")
                .userId("user-123")
                .type("BASIC")
                .build();

        mockSecurityContext();

        Mockito.when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        Mockito.when(valueOperations.setIfAbsent(anyString(), anyString(), anyLong(), any())).thenReturn(true);

        UserResponse userDto = UserResponse.builder()
                .id("user-123")
                .email("user@example.com")
                .username("Test User")
                .fullName("Test User FullName")
                .baseCurrency("VND")
                .build();
        ApiResponse<UserResponse> userResponse = ApiResponse.<UserResponse>builder()
                .code(1000)
                .result(userDto)
                .build();
        Mockito.when(identityClient.getMyInfo()).thenReturn(userResponse);

        // Mock walletClient response
        Mockito.when(walletClient.getWallet(eq("wallet-source")))
                .thenReturn(ApiResponse.<WalletResponse>builder().code(1000).result(sourceWallet).build());
        Mockito.when(walletClient.getWallet(eq("wallet-target")))
                .thenReturn(ApiResponse.<WalletResponse>builder().code(1000).result(targetWallet).build());

        // Mock update balance success by default
        Mockito.when(walletClient.updateBalance(anyString(), any()))
                .thenReturn(ApiResponse.<WalletResponse>builder().code(1000).result(sourceWallet).build());
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void mockSecurityContext() {
        SecurityContext securityContext = Mockito.mock(SecurityContext.class);
        Authentication authentication = Mockito.mock(Authentication.class);
        Jwt jwt = Mockito.mock(Jwt.class);

        SecurityContextHolder.setContext(securityContext);
        Mockito.when(securityContext.getAuthentication()).thenReturn(authentication);
        Mockito.when(authentication.isAuthenticated()).thenReturn(true);
        Mockito.when(authentication.getPrincipal()).thenReturn(jwt);
        Mockito.when(jwt.getClaimAsString("userId")).thenReturn("user-123");
    }

    @Test
    @DisplayName("Test 1: Transfer thành công - Trừ tiền, gửi event, đích nhận tiền, chuyển trạng thái COMPLETED")
    void testTransfer_SuccessFlow() {
        TransferRequest request = TransferRequest.builder()
                .fromWalletId("wallet-source")
                .toWalletId("wallet-target")
                .amount(BigDecimal.valueOf(200000))
                .note("Chuyển tiền test")
                .build();

        // 1. Tạo transfer
        TransactionResponse response = transactionCommandService.transfer(request);

        Assertions.assertNotNull(response.getId());
        Assertions.assertEquals("PENDING", response.getTransferStatus());

        Optional<Transaction> txOpt = transactionRepository.findById(response.getId());
        Assertions.assertTrue(txOpt.isPresent());
        Transaction tx = txOpt.get();

        Assertions.assertEquals(0, BigDecimal.valueOf(200000).compareTo(tx.getAmount()));
        Assertions.assertNotNull(tx.getSagaId());

        // 2. Giả lập Wallet Service xử lý xong ở đích và gửi lại sự kiện CREDIT_COMPLETED
        TransferResultEvent successEvent = TransferResultEvent.builder()
                .sagaId(tx.getSagaId())
                .success(true)
                .build();

        transferSagaListener.handleCreditCompleted(successEvent);

        // 3. Kiểm tra kết quả
        Transaction completedTx = transactionRepository.findById(response.getId()).get();
        Assertions.assertEquals(com.fintrack.transaction_service.enums.TransferStatus.COMPLETED, completedTx.getTransferStatus());

        // Kiểm tra target transaction cũng được cập nhật
        Optional<Transaction> targetTxOpt = transactionRepository.findBySagaIdAndType(tx.getSagaId(), TransactionType.INCOME);
        Assertions.assertTrue(targetTxOpt.isPresent());
        Assertions.assertEquals(com.fintrack.transaction_service.enums.TransferStatus.COMPLETED, targetTxOpt.get().getTransferStatus());
    }

    @Test
    @DisplayName("Test 2: Transfer thất bại - Hoàn tiền (Compensation) khi ví đích gặp lỗi")
    void testTransfer_FailureFlow_Compensation() {
        TransferRequest request = TransferRequest.builder()
                .fromWalletId("wallet-source")
                .toWalletId("wallet-target")
                .amount(BigDecimal.valueOf(200000))
                .note("Chuyển tiền test lỗi")
                .build();

        TransactionResponse response = transactionCommandService.transfer(request);
        Transaction tx = transactionRepository.findById(response.getId()).get();

        // Giả lập Wallet Service báo lỗi ở ví đích
        TransferResultEvent failedEvent = TransferResultEvent.builder()
                .sagaId(tx.getSagaId())
                .success(false)
                .reason("Wallet target has been closed")
                .build();

        transferSagaListener.handleCreditFailed(failedEvent);

        // Kiểm tra kết quả
        Transaction compensatedTx = transactionRepository.findById(response.getId()).get();
        Assertions.assertEquals(com.fintrack.transaction_service.enums.TransferStatus.COMPENSATED, compensatedTx.getTransferStatus());

        // Đảm bảo OutboxService được gọi để ghi nhận refund, do ta mock toàn bộ TransactionCommandService
        // nên đoạn check log hoặc mock behavior sẽ phụ thuộc vào OutboxService
    }

    @Test
    @DisplayName("Test 3: Lỗi không đủ tiền - Yêu cầu Transfer bị từ chối ngay lập tức")
    void testTransfer_InsufficientBalance() {
        // Đặt số dư ví nguồn về nhỏ hơn amount
        Mockito.when(walletClient.getWallet(eq("wallet-source")))
                .thenReturn(ApiResponse.<WalletResponse>builder().code(1000).result(
                        WalletResponse.builder().id("wallet-source").userId("user-123").balance(BigDecimal.valueOf(10000)).build()
                ).build());

        TransferRequest request = TransferRequest.builder()
                .fromWalletId("wallet-source")
                .toWalletId("wallet-target")
                .amount(BigDecimal.valueOf(200000))
                .note("Vượt quá số dư")
                .build();

        com.fintrack.transaction_service.exception.AppException exception = Assertions.assertThrows(
                com.fintrack.transaction_service.exception.AppException.class,
                () -> transactionCommandService.transfer(request)
        );

        Assertions.assertEquals("INSUFFICIENT_BALANCE", exception.getErrorCode().name());
        Assertions.assertEquals(0, transactionRepository.count());
    }
}
