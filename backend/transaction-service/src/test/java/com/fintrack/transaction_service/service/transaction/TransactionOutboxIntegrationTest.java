package com.fintrack.transaction_service.service.transaction;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fintrack.transaction_service.dto.request.TransactionCreationRequest;
import com.fintrack.transaction_service.dto.response.ApiResponse;
import com.fintrack.transaction_service.dto.response.TransactionResponse;
import com.fintrack.transaction_service.dto.response.UserResponse;
import com.fintrack.transaction_service.dto.response.WalletResponse;
import com.fintrack.transaction_service.entity.Category;
import com.fintrack.transaction_service.entity.OutboxEvent;
import com.fintrack.transaction_service.entity.Transaction;
import com.fintrack.transaction_service.enums.TransactionType;
import com.fintrack.transaction_service.repository.CategoryRepository;
import com.fintrack.transaction_service.repository.OutboxEventRepository;
import com.fintrack.transaction_service.repository.TransactionRepository;
import com.fintrack.transaction_service.repository.httpclient.IdentityClient;
import com.fintrack.transaction_service.repository.httpclient.WalletClient;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
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
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
public class TransactionOutboxIntegrationTest {

    @Autowired
    private TransactionCommandService transactionCommandService;

    @Autowired
    private OutboxEventRepository outboxEventRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private OutboxRelayScheduler outboxRelayScheduler;

    @Autowired
    private ObjectMapper objectMapper;

    // --- Mock External Infrastructure Beans ---
    @MockitoBean
    private WalletClient walletClient;

    @MockitoBean
    private IdentityClient identityClient;

    @MockitoBean
    private KafkaTemplate<String, Object> kafkaTemplate;

    @MockitoBean
    private StringRedisTemplate redisTemplate;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    private ValueOperations<String, String> valueOperations;

    private Category testCategory;
    private WalletResponse testWallet;

    @BeforeEach
    void setUp() {
        valueOperations = Mockito.mock(ValueOperations.class);
        // Clear all data
        outboxEventRepository.deleteAll();
        jdbcTemplate.execute("DELETE FROM transactions");
        jdbcTemplate.execute("DELETE FROM categories");

        // Cài đặt danh mục test
        testCategory = Category.builder()
                .name("Ăn uống")
                .type(TransactionType.EXPENSE)
                .userId("user-123")
                .description("Ăn uống ngon miệng")
                .build();
        testCategory = categoryRepository.save(testCategory);

        // Ví test mặc định
        testWallet = WalletResponse.builder()
                .id("wallet-999")
                .name("Ví chính")
                .balance(BigDecimal.valueOf(1000000))
                .currency("VND")
                .userId("user-123")
                .type("BASIC")
                .build();

        // Mặc định mock Security Context
        mockSecurityContext();

        // Mặc định mock Redis Lock cho phép tạo giao dịch
        Mockito.when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        Mockito.when(valueOperations.setIfAbsent(anyString(), anyString(), anyLong(), any())).thenReturn(true);

        // Mặc định mock IdentityClient trả thông tin user thành công
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

        // Mặc định mock walletClient.getWallet trả thông tin ví cho tryGetWallet
        ApiResponse<WalletResponse> getWalletResponse = ApiResponse.<WalletResponse>builder()
                .code(1000)
                .result(testWallet)
                .build();
        Mockito.when(walletClient.getWallet(anyString())).thenReturn(getWalletResponse);
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
    @DisplayName("Test 1: Tạo giao dịch khi Wallet Service ONLINE - Outbox phải hoàn thành tức thì")
    void testCreateTransaction_WithWalletServiceOnline_ShouldCompleteOutboxEvent() throws Exception {
        // Arrange: wallet service hoạt động bình thường
        ApiResponse<WalletResponse> mockResponse = ApiResponse.<WalletResponse>builder()
                .code(1000)
                .result(testWallet)
                .build();
        Mockito.when(walletClient.updateBalance(anyString(), any())).thenReturn(mockResponse);

        TransactionCreationRequest request = TransactionCreationRequest.builder()
                .walletId("wallet-999")
                .amount(BigDecimal.valueOf(50000))
                .type(TransactionType.EXPENSE)
                .categoryId(testCategory.getId())
                .note("Mua cốc cafe")
                .date(Instant.now())
                .build();

        // Act: tạo giao dịch
        TransactionResponse response = transactionCommandService.create(request);

        // Assert: kiểm chứng giao dịch đã được ghi vào DB
        Assertions.assertNotNull(response.getId());
        Optional<Transaction> savedTx = transactionRepository.findById(response.getId());
        Assertions.assertTrue(savedTx.isPresent());
        Assertions.assertEquals(0, BigDecimal.valueOf(50000).compareTo(savedTx.get().getAmount()));

        // Assert: kiểm chứng Outbox record đã được tạo ở trạng thái PENDING
        List<OutboxEvent> outboxEvents = outboxEventRepository.findAll();
        Assertions.assertEquals(1, outboxEvents.size());
        OutboxEvent event = outboxEvents.get(0);
        Assertions.assertEquals("PENDING", event.getStatus());
        Assertions.assertEquals("WALLET_UPDATE", event.getEventType());

        // Act: Kích hoạt Outbox relay scheduler chạy ngầm
        outboxRelayScheduler.processOutboxEvents();

        // Assert: Outbox record chuyển trạng thái sang COMPLETED
        OutboxEvent processedEvent = outboxEventRepository.findById(event.getId()).orElseThrow();
        Assertions.assertEquals("COMPLETED", processedEvent.getStatus());
        Assertions.assertNotNull(processedEvent.getProcessedAt());
        Assertions.assertNull(processedEvent.getErrorMessage());

        // Kiểm chứng Feign Client walletClient được gọi chính xác
        Mockito.verify(walletClient, Mockito.times(1)).updateBalance(eq("wallet-999"), any());
    }

    @Test
    @DisplayName("Test 2: Tạo giao dịch khi Wallet Service OFFLINE - Scheduler phải Retry và hoàn thành khi Online lại")
    void testCreateTransaction_WithWalletServiceOffline_ShouldRetryAndEventuallyComplete() throws Exception {
        // Arrange: Mô phỏng wallet service bị ngoại tuyến (ném Exception)
        Mockito.when(walletClient.updateBalance(anyString(), any()))
                .thenThrow(new RuntimeException("Connect timeout: wallet-service offline"));

        TransactionCreationRequest request = TransactionCreationRequest.builder()
                .walletId("wallet-999")
                .amount(BigDecimal.valueOf(150000))
                .type(TransactionType.EXPENSE)
                .categoryId(testCategory.getId())
                .note("Đóng tiền điện")
                .date(Instant.now())
                .build();

        // Act: Tạo giao dịch (giao dịch phải lưu thành công bất chấp wallet-service offline)
        TransactionResponse response = transactionCommandService.create(request);
        Assertions.assertNotNull(response.getId());

        // Act: Scheduler quét Outbox lần 1
        outboxRelayScheduler.processOutboxEvents();

        // Assert: Outbox event không được hoàn thành mà tăng retryCount và delay nextRetryAt
        List<OutboxEvent> outboxEvents = outboxEventRepository.findAll();
        Assertions.assertEquals(1, outboxEvents.size());
        OutboxEvent event = outboxEvents.get(0);
        Assertions.assertEquals("PENDING", event.getStatus());
        Assertions.assertEquals(1, event.getRetryCount());
        Assertions.assertNotNull(event.getNextRetryAt());
        Assertions.assertNotNull(event.getErrorMessage());
        Assertions.assertTrue(event.getErrorMessage().contains("wallet-service offline"));

        // Act: Scheduler quét tiếp lần 2 khi chưa tới nextRetryAt -> không xử lý (vẫn giữ nguyên)
        outboxRelayScheduler.processOutboxEvents();
        OutboxEvent eventAttempt2 = outboxEventRepository.findById(event.getId()).orElseThrow();
        Assertions.assertEquals(1, eventAttempt2.getRetryCount()); // Vẫn là 1, không tăng vì chưa tới giờ retry

        // Arrange: Wallet service online trở lại
        ApiResponse<WalletResponse> mockResponse = ApiResponse.<WalletResponse>builder()
                .code(1000)
                .result(testWallet)
                .build();
        Mockito.doReturn(mockResponse).when(walletClient).updateBalance(anyString(), any());

        // Giả lập thời gian trôi qua (Tua nextRetryAt về quá khứ để được phép xử lý)
        eventAttempt2.setNextRetryAt(Instant.now().minusSeconds(1));
        outboxEventRepository.save(eventAttempt2);

        // Act: Scheduler quét lại lần 3
        outboxRelayScheduler.processOutboxEvents();

        // Assert: Outbox event chuyển sang COMPLETED thành công
        OutboxEvent finalEvent = outboxEventRepository.findById(event.getId()).orElseThrow();
        Assertions.assertEquals("COMPLETED", finalEvent.getStatus());
        Assertions.assertNull(finalEvent.getErrorMessage());
        Assertions.assertEquals(1, finalEvent.getRetryCount());
    }

    @Test
    @DisplayName("Test 3: Wallet Service sập liên tục quá MAX_RETRIES - Event phải chuyển sang FAILED (Dead Letter)")
    void testCreateTransaction_WithPersistentFailure_ShouldMoveToDeadLetter() throws Exception {
        // Arrange: Wallet service sập vĩnh viễn
        Mockito.when(walletClient.updateBalance(anyString(), any()))
                .thenThrow(new RuntimeException("Fatal network error: wallet-service down"));

        TransactionCreationRequest request = TransactionCreationRequest.builder()
                .walletId("wallet-999")
                .amount(BigDecimal.valueOf(20000))
                .type(TransactionType.INCOME)
                .categoryId(testCategory.getId())
                .note("Quà tặng")
                .date(Instant.now())
                .build();

        // Act: Tạo giao dịch
        TransactionResponse response = transactionCommandService.create(request);
        Assertions.assertNotNull(response.getId());

        // Lặp scheduler 5 lần liên tiếp để đẩy vượt quá MAX_RETRIES = 5
        for (int i = 1; i <= 5; i++) {
            // Lấy event và tua nextRetryAt về quá khứ để scheduler tiếp tục quét
            List<OutboxEvent> events = outboxEventRepository.findAll();
            OutboxEvent currentEvent = events.get(0);
            currentEvent.setNextRetryAt(Instant.now().minusSeconds(1));
            outboxEventRepository.save(currentEvent);

            // Chạy scheduler
            outboxRelayScheduler.processOutboxEvents();
        }

        // Assert: Event đã hết lượt retry và chuyển sang FAILED (Dead Letter Queue)
        List<OutboxEvent> finalEvents = outboxEventRepository.findAll();
        OutboxEvent deadLetterEvent = finalEvents.get(0);
        Assertions.assertEquals("FAILED", deadLetterEvent.getStatus());
        Assertions.assertEquals(5, deadLetterEvent.getRetryCount());
        Assertions.assertNotNull(deadLetterEvent.getErrorMessage());
        Assertions.assertTrue(deadLetterEvent.getErrorMessage().contains("wallet-service down"));
    }

    @Test
    @DisplayName("Test 4: Redis Lock chống double-submit khi tạo giao dịch trùng lặp đồng thời")
    void testDoubleSubmit_RedisLock_ShouldBlockDuplicateRequests() {
        // Arrange: Giả lập lock đã được giữ bởi request khác (opsForValue().setIfAbsent trả về false)
        Mockito.when(valueOperations.setIfAbsent(anyString(), anyString(), anyLong(), any())).thenReturn(false);

        TransactionCreationRequest request = TransactionCreationRequest.builder()
                .walletId("wallet-999")
                .amount(BigDecimal.valueOf(30000))
                .type(TransactionType.EXPENSE)
                .categoryId(testCategory.getId())
                .note("Mua kẹo double click")
                .date(Instant.now())
                .build();

        // Act & Assert: Gọi hàm tạo giao dịch phải ném ra lỗi yêu cầu đang xử lý (REQUEST_PROCESSING)
        com.fintrack.transaction_service.exception.AppException exception = Assertions.assertThrows(
                com.fintrack.transaction_service.exception.AppException.class,
                () -> transactionCommandService.create(request)
        );

        Assertions.assertEquals("REQUEST_PROCESSING", exception.getErrorCode().name());
        // Đảm bảo không có giao dịch nào được lưu vào DB
        Assertions.assertEquals(0, transactionRepository.count());
    }
}
