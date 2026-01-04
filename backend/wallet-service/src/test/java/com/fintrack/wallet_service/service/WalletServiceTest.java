package com.fintrack.wallet_service.service;

import com.fintrack.wallet_service.dto.request.WalletCreationRequest;
import com.fintrack.wallet_service.dto.request.WalletUpdateRequest;
import com.fintrack.wallet_service.dto.response.WalletResponse;
import com.fintrack.wallet_service.entity.Wallet;
import com.fintrack.wallet_service.exception.AppException;
import com.fintrack.wallet_service.exception.ErrorCode;
import com.fintrack.wallet_service.mapper.WalletMapper;
import com.fintrack.wallet_service.repository.WalletRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class) // sử dụng mockito
public class WalletServiceTest {

    @Mock
    private WalletRepository walletRepository; // giả lập cái Repository

    @Mock
    private WalletMapper walletMapper; // giả lập cái Mapper

    @InjectMocks
    private WalletService walletService; // Inject mấy cái Mock ở trên vào Service thật

    private WalletCreationRequest creationRequest;
    private WalletUpdateRequest updateRequest;
    private Wallet wallet;
    private WalletResponse walletResponse;
    private final String userId = "user-123";

    @BeforeEach
    void initData() {
        // Chuẩn bị dữ liệu mẫu trước mỗi bài test
        creationRequest = WalletCreationRequest.builder()
                .name("Ví test")
                .currency("VND")
                .initialBalance(new BigDecimal(1000000))
                .build();

        updateRequest = new WalletUpdateRequest();
        updateRequest.setName("Ví đã sửa");

        wallet = Wallet.builder()
                .id("wallet-123")
                .userId(userId)
                .name("Ví test")
                .currency("VND")
                .balance(new BigDecimal(1000000))
                .isActive(true)
                .build();

        walletResponse = WalletResponse.builder()
                .id("wallet-123")
                .name("Ví test")
                .currency("VND")
                .balance(new BigDecimal(1000000))
                .build();
    }

    // --- Helper function: Giả lập đăng nhập (Để đỡ phải viết lại nhiều lần) ---
    private void mockSecurityContext() {
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        Jwt jwt = mock(Jwt.class);

        SecurityContextHolder.setContext(securityContext);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(jwt);
        when(jwt.getClaimAsString("userId")).thenReturn(userId);
    }

    @Test
    void createWallet_ValidRequest_Success() {
        // GIVEN: Chuẩn bị kịch bản (Giả lập Security Context và Mock trả về gì)

        // 1. Giả lập môi trường Security
        mockSecurityContext();

        // 2. Giả lập hành vi của Mapper và Repository
        when(walletMapper.toWallet(any(WalletCreationRequest.class))).thenReturn(wallet);
        when(walletRepository.save(any(Wallet.class))).thenReturn(wallet);
        when(walletMapper.toWalletResponse(any(Wallet.class))).thenReturn(walletResponse);

        // WHEN: Thực hiện hành động (Gọi hàm cần test)
        WalletResponse response = walletService.create(creationRequest);

        // THEN: Kiểm tra kết quả
        assertNotNull(response);
        assertEquals("wallet-123", response.getId());
        assertEquals("Ví test", response.getName());
        assertEquals(new BigDecimal(1000000), response.getBalance());
    }

    @Test
    void createWallet_ExistedName_Fail() {
        // GIVEN:
        mockSecurityContext();
        when(walletRepository.existsByUserIdAndName(userId, "Ví test")).thenReturn(true);

        // WHEN + THEN:
        // Mong đợi ném ra lỗi AppException với code WALLET_EXISTED
        AppException exception = assertThrows(AppException.class,
                () -> walletService.create(creationRequest));

        assertEquals(ErrorCode.WALLET_EXISTED, exception.getErrorCode());
    }

    @Test
    void getMyWallets_Success() {
        // GIVE:
        mockSecurityContext();
        when(walletRepository.findByUserIdAndIsActiveTrueOrderByCreatedAtDesc(userId))
                .thenReturn(List.of(wallet));
        when(walletMapper.toWalletResponse(any(Wallet.class))).thenReturn(walletResponse);

        // WHEN:
        var responses = walletService.getMyWallets();

        // THEN:
        assertEquals(1, responses.size());
        assertEquals("wallet-123", responses.get(0).getId());
    }

    @Test
    void updateWallet_Success() {
        // GIVEN
        mockSecurityContext();
        // Giả lập tìm thấy ví
        when(walletRepository.findByIdAndUserId("wallet-123", userId))
                .thenReturn(Optional.of(wallet));
        when(walletRepository.save(any(Wallet.class))).thenReturn(wallet);

        // Giả lập mapper trả về kết quả đã sửa (phải tạo object response mới khớp với updateRequest)
        WalletResponse updatedResponse = WalletResponse.builder()
                .id("wallet-123")
                .name("Ví đã sửa") // Tên mới
                .build();
        when(walletMapper.toWalletResponse(any(Wallet.class))).thenReturn(updatedResponse);

        // WHEN
        WalletResponse response = walletService.update("wallet-123", updateRequest);

        // THEN
        assertNotNull(response);
        assertEquals("Ví đã sửa", response.getName());
    }

    @Test
    void updateWallet_NotFound_Fail() {
        // GIVEN
        mockSecurityContext();
        // Giả lập tìm không thấy ví (Optional.empty)
        when(walletRepository.findByIdAndUserId("wallet-123", userId))
                .thenReturn(Optional.empty());

        // WHEN & THEN
        AppException exception = assertThrows(AppException.class,
                () -> walletService.update("wallet-123", updateRequest));

        assertEquals(ErrorCode.WALLET_NOT_FOUND, exception.getErrorCode());
    }

    @Test
    void deleteWallet_Success() {
        // GIVEN
        mockSecurityContext();
        // Giả lập tìm thấy ví
        when(walletRepository.findByIdAndUserId("wallet-123", userId))
                .thenReturn(Optional.of(wallet));

        // WHEN
        walletService.delete("wallet-123");

        // THEN
        // Kiểm tra xem hàm save có được gọi không và tham số truyền vào có đúng là active = false không
        verify(walletRepository).save(argThat(argument ->
                argument.getId().equals("wallet-123") && !argument.isActive()
        ));
    }
}


