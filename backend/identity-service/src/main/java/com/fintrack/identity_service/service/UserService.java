package com.fintrack.identity_service.service;

import com.fintrack.identity_service.dto.request.PasswordChangeRequest;
import com.fintrack.identity_service.dto.request.ProfileUpdateRequest;
import com.fintrack.identity_service.dto.request.UserCreationRequest;
import com.fintrack.identity_service.dto.response.UserResponse;
import com.fintrack.identity_service.entity.Role;
import com.fintrack.identity_service.entity.User;
import com.fintrack.identity_service.exception.AppException;
import com.fintrack.identity_service.exception.ErrorCode;
import com.fintrack.identity_service.mapper.UserMapper;
import com.fintrack.identity_service.repository.RoleRepository;
import com.fintrack.identity_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {
    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final RoleRepository roleRepository;

    private static final String DEFAULT_ROLE = "USER";

    public List<User> getUsers() {
        return userRepository.findAll();
    }

    @Transactional
    public UserResponse updateProfile(ProfileUpdateRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        userMapper.updateUser(user, request);

        return userMapper.toUserResponse(userRepository.save(user));
    }

    @Transactional
    public void changePassword(PasswordChangeRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // 1. Kiểm tra mật khẩu cũ
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new AppException(ErrorCode.PASSWORD_INCORRECT);
        }

        // 2. Mã hóa và lưu mật khẩu mới
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        log.info("User {} changed password successfully", username);
    }

    @Transactional
    public UserResponse updateAvatar(String avatarUrl) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        user.setAvatar(avatarUrl);
        return userMapper.toUserResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse createUser(UserCreationRequest request) {
        // 1. Validate input
        if (userRepository.existsByUsername(request.getUsername()) ||
                userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        // 2. Map & Encode Password
        User user = userMapper.toUser(request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        // 3. Xử lý Roles (Tách ra hàm riêng cho gọn)
        Set<Role> roles = resolveRoles(request.getRoles());
        user.setRoles(roles);

        // 4. Save & Return
        // Dùng saveAndFlush nếu bạn muốn đảm bảo tính toàn vẹn ngay lập tức (đặc biệt với bảng liên kết)
        // Nếu @Transactional hoạt động tốt thì .save() là đủ, nhưng .saveAndFlush() an toàn hơn khi debug
        return userMapper.toUserResponse(userRepository.saveAndFlush(user));
    }

    //Helper method: Xử lý logic gán quyền
    private Set<Role> resolveRoles(Set<String> requestRoles) {
        // Nếu có gửi role -> Tìm và trả về
        if (requestRoles != null && !requestRoles.isEmpty()) {
            return new HashSet<>(roleRepository.findAllById(requestRoles));
        }

        // Nếu không gửi role -> Lấy role mặc định
        Role defaultRole = roleRepository.findById(DEFAULT_ROLE)
                .orElseThrow(() -> {
                    log.error("CRITICAL ERROR: Default role '{}' not found in DB", DEFAULT_ROLE);
                    // Nên ném ra lỗi hệ thống thay vì RuntimeException chung chung
                    return new AppException(ErrorCode.ROLE_NOT_EXISTED);
                });

        // Trả về Set chứa role mặc định (HashSet mutable để Hibernate dễ xử lý)
        Set<Role> defaultRoles = new HashSet<>();
        defaultRoles.add(defaultRole);
        return defaultRoles;
    }

    public UserResponse getUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        return userMapper.toUserResponse(user);
    }

    public UserResponse getMyInfo() {
        // Lấy username từ SecurityContext (do JwtFilter đã decode token và bỏ vào đây)
        var context = SecurityContextHolder.getContext();
        String name = context.getAuthentication().getName();

        User user = userRepository.findByUsername(name)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        return userMapper.toUserResponse(user);
    }
}
