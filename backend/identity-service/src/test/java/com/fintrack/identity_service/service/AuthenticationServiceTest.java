package com.fintrack.identity_service.service;

import com.fintrack.identity_service.dto.request.AuthenticationRequest;
import com.fintrack.identity_service.dto.response.AuthenticationResponse;
import com.fintrack.identity_service.entity.User;
import com.fintrack.identity_service.exception.AppException;
import com.fintrack.identity_service.exception.ErrorCode;
import com.fintrack.identity_service.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(value = MockitoExtension.class)
public class AuthenticationServiceTest {
    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private org.springframework.data.redis.core.StringRedisTemplate redisTemplate;
    @Mock
    private org.springframework.data.redis.core.ValueOperations<String, String> valueOperations;

    @InjectMocks
    private AuthenticationService authenticationService;

    private AuthenticationRequest authRequest;
    private User user;

    @BeforeEach
    void initData() {
        authRequest = AuthenticationRequest.builder()
                .username("hau_nguyen")
                .password("123456")
                .build();

        user = User.builder()
                .id("user-id-123")
                .username("hau_nguyen")
                .password("encoded_password") // Giả lập pass đã hash trong DB
                .build();

        // QUAN TRỌNG: Set Signer Key giả để hàm generateToken không bị lỗi NullPointer hoặc lỗi Key ngắn
        // Key này phải đủ dài (ít nhất 32 ký tự) cho thuật toán HS512
        ReflectionTestUtils.setField(authenticationService, "SIGNER_KEY",
                "1234567890123456789012345678901234567890123456789012345678901111"); // 64 digits
    }

    @Test
    void authenticate_Success() {
        // GIVEN
        when(redisTemplate.hasKey(anyString())).thenReturn(false);
        when(userRepository.findByUsernameAndDeletedFalse(anyString())).thenReturn(Optional.of(user));
        // Giả lập pass nhập vào khớp với pass trong DB
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);
        // Giả lập lưu user (để update currentJwtId)
        when(userRepository.save(any(User.class))).thenReturn(user);

        // WHEN
        AuthenticationResponse response = authenticationService.authenticate(authRequest);

        // THEN
        assertNotNull(response);
        assertTrue(response.isAuthenticated());;
        assertNotNull(response.getToken()); // Token phải được sinh ra
    }

    @Test
    void authenticate_UserNotFound_Fail() {
        // GIVEN
        when(redisTemplate.hasKey(anyString())).thenReturn(false);
        when(userRepository.findByUsernameAndDeletedFalse(anyString())).thenReturn(Optional.empty());

        // WHEN & THEN
        AppException exception = assertThrows(AppException.class,
                () -> authenticationService.authenticate(authRequest));

        assertEquals(ErrorCode.USER_NOT_EXISTED, exception.getErrorCode());
    }

    @Test
    void authenticate_WrongPassword_Fail() {
        // GIVEN
        when(redisTemplate.hasKey(anyString())).thenReturn(false);
        when(userRepository.findByUsernameAndDeletedFalse(anyString())).thenReturn(Optional.of(user));
        // Giả lập pass nhập vào KHÔNG khớp
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        // WHEN & THEN
        AppException exception = assertThrows(AppException.class,
                () -> authenticationService.authenticate(authRequest));

        assertEquals(ErrorCode.UNAUTHENTICATED, exception.getErrorCode());
    }
}
