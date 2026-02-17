package com.fintrack.identity_service.service;

import com.fintrack.identity_service.dto.event.UserDeletedEvent;
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
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {
    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final RoleRepository roleRepository;

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final CloudinaryService cloudinaryService;

    private static final String DEFAULT_ROLE = "USER";

    public List<User> getUsers() {
        return userRepository.findAll();
    }

    @Transactional
    public void deleteAccount() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsernameAndDeletedFalse(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // 1. LƯU LẠI EMAIL THẬT TRƯỚC KHI XÓA
        String originalEmail = user.getEmail();

        // 2. Soft Delete & Randomize
        user.setDeleted(true);
        String uniqueId = UUID.randomUUID().toString();
        user.setEmail("deleted_" + uniqueId + "_" + user.getEmail());
        user.setUsername("deleted_" + uniqueId + "_" + user.getUsername());

        userRepository.save(user); // Transactional sẽ tự flush, gán save cho chắc ăn

        // 3. GỬI SỰ KIỆN QUA KAFKA ĐỂ CÁC SERVICE KHÁC DỌN RÁC
        UserDeletedEvent event = UserDeletedEvent.builder()
                .userId(user.getId())
                .email(originalEmail) // Gửi email thật cho Notification Service
                .build();

        kafkaTemplate.send("user-deleted-topic", event);
        log.info("Đã gửi event xóa tài khoản cho userId: {}", user.getId());

        // 4. Xóa ảnh trên Cloudinary
        if (user.getAvatar() != null && !user.getAvatar().isEmpty()) {
            try {
                cloudinaryService.deleteImage(user.getAvatar());
            } catch (Exception e) {
                log.error("Lỗi khi xóa avatar của user {} trên Cloudinary: {}", user.getId(), e.getMessage());
            }
        }
    }

    @Transactional
    public UserResponse updateProfile(ProfileUpdateRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsernameAndDeletedFalse(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        userMapper.updateUser(user, request);

        return userMapper.toUserResponse(userRepository.save(user));
    }

    @Transactional
    public void changePassword(PasswordChangeRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsernameAndDeletedFalse(username)
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
        User user = userRepository.findByUsernameAndDeletedFalse(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        user.setAvatar(avatarUrl);
        return userMapper.toUserResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse createUser(UserCreationRequest request) {
        // 1. Validate input
        if (userRepository.existsByUsernameAndDeletedFalse(request.getUsername()) ||
                userRepository.existsByEmailAndDeletedFalse(request.getEmail())) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        // 2. Map & Encode Password
        User user = userMapper.toUser(request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        if (user.getBaseCurrency() == null || user.getBaseCurrency().trim().isEmpty()) {
            user.setBaseCurrency("VND");
        }

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

        User user = userRepository.findByUsernameAndDeletedFalse(name)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        return userMapper.toUserResponse(user);
    }
}