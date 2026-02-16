package com.fintrack.identity_service.service;

import com.fintrack.identity_service.dto.request.UserCreationRequest;
import com.fintrack.identity_service.dto.response.UserResponse;
import com.fintrack.identity_service.entity.Role;
import com.fintrack.identity_service.entity.User;
import com.fintrack.identity_service.exception.AppException;
import com.fintrack.identity_service.exception.ErrorCode;
import com.fintrack.identity_service.mapper.UserMapper;
import com.fintrack.identity_service.repository.RoleRepository;
import com.fintrack.identity_service.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(value = MockitoExtension.class)
public class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private UserMapper userMapper;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private UserCreationRequest request;
    private UserResponse response;
    private User user;

    @BeforeEach
    void initData() {
        request = UserCreationRequest.builder()
                .username("test")
                .password("password123")
                .fullName("Test User")
                .roles(Set.of("USER"))
                .email("test@gmail.com")
                .build();

        response = UserResponse.builder()
                .id("123456")
                .username("test")
                .fullName("Test User")
                .email("test@gmail.com")
                .build();

        user = User.builder()
                .id("123456")
                .username("test")
                .password("encodedPassword123")
                .fullName("Test User")
                .email("test@gmail.com")
                .build();
    }


    @Test
    void createUser_ValidRequest_Success() {
        // GIVEN
        when(userRepository.existsByUsernameAndDeletedFalse(anyString())).thenReturn(false);
        when(userRepository.existsByEmailAndDeletedFalse(any())).thenReturn(false);
        when(userMapper.toUser(any(UserCreationRequest.class))).thenReturn(user);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword123");

        Role roleUser = Role.builder()
                .name("USER")
                .build();
        when(roleRepository.findAllById(any())).thenReturn(Collections.singletonList(roleUser));

        when(userRepository.save(any(User.class))).thenReturn(user);
        when(userMapper.toUserResponse(any(User.class))).thenReturn(response);

        // WHEN
        var result = userService.createUser(request);

        // THEN
        assertEquals("123456", result.getId());
        assertEquals("test", result.getUsername());
    }

    @Test
    void createUser_UserExisted_Fail() {
        // GIVEN
        when(userRepository.existsByUsernameAndDeletedFalse(anyString())).thenReturn(true);

        // WHEN & THEN
        var exception = assertThrows(AppException.class, () -> userService.createUser(request));

        assertEquals(ErrorCode.USER_EXISTED, exception.getErrorCode());
    }

    @Test
    void getUser_ValidUserId_Success() {
        // GIVEN
        when(userRepository.findById(anyString())).thenReturn(Optional.ofNullable(user));
        when(userMapper.toUserResponse(any(User.class))).thenReturn(response);

        // WHEN
        var result = userService.getUser("123456");

        // THEN
        assertEquals("123456", result.getId());
        assertEquals("test", result.getUsername());
    }
}
