package com.fintrack.identity_service.component;

import com.fintrack.identity_service.entity.Permission;
import com.fintrack.identity_service.entity.Role;
import com.fintrack.identity_service.entity.User;
import com.fintrack.identity_service.repository.PermissionRepository;
import com.fintrack.identity_service.repository.RoleRepository;
import com.fintrack.identity_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info("Bắt đầu seed dữ liệu khởi tạo...");

        // 1. Tạo các Permission cốt lõi (Nạp lần lượt vào DB, kiểm tra tồn tại)
        // --- Identity ---
        Permission userRead = createPermissionIfNotFound("USER_READ", "Xem thông tin user");
        Permission userUpdate = createPermissionIfNotFound("USER_UPDATE", "Sửa thông tin user");
        Permission roleManage = createPermissionIfNotFound("ROLE_MANAGE", "Quản lý Role/Permission");

        // --- Wallet (Ví) ---
        Permission walletCreate = createPermissionIfNotFound("WALLET_CREATE", "Tạo ví mới");
        Permission walletRead = createPermissionIfNotFound("WALLET_READ", "Xem danh sách ví");
        Permission walletUpdate = createPermissionIfNotFound("WALLET_UPDATE", "Sửa ví");
        Permission walletDelete = createPermissionIfNotFound("WALLET_DELETE", "Xóa ví");

        // --- Transaction (Giao dịch) ---
        Permission txCreate = createPermissionIfNotFound("TX_CREATE", "Tạo giao dịch");
        Permission txRead = createPermissionIfNotFound("TX_READ", "Xem giao dịch");

        // 2. Định nghĩa Role ADMIN (Quản trị hệ thống)
        if (roleRepository.findById("ADMIN").isEmpty()) {
            Set<Permission> adminPermissions = new HashSet<>();
            adminPermissions.add(userRead);
            adminPermissions.add(userUpdate);
            adminPermissions.add(roleManage);
            // Admin SaaS thường không can thiệp ví user, nhưng có thể xem thống kê

            Role adminRole = Role.builder()
                    .name("ADMIN")
                    .description("System Admin")
                    .permissions(adminPermissions)
                    .build();
            roleRepository.save(adminRole);
            log.info("Đã tạo role ADMIN");
        }

        // 3. Định nghĩa Role USER (Người dùng phổ thông)
        if (roleRepository.findById("USER").isEmpty()) {
            Set<Permission> userPermissions = new HashSet<>();
            userPermissions.add(userRead); // Xem profile chính mình
            userPermissions.add(userUpdate); // Sửa profile chính mình

            // Full quyền với Ví và Giao dịch của chính họ
            userPermissions.add(walletCreate);
            userPermissions.add(walletRead);
            userPermissions.add(walletUpdate);
            userPermissions.add(walletDelete);
            userPermissions.add(txCreate);
            userPermissions.add(txRead);

            Role userRole = Role.builder()
                    .name("USER")
                    .description("Standard User")
                    .permissions(userPermissions)
                    .build();
            roleRepository.save(userRole);
            log.info("Đã tạo role USER");
        }

        // 4. Tạo tài khoản Admin mặc định
        if (userRepository.findByUsernameAndDeletedFalse("admin").isEmpty()) {
            Role adminRole = roleRepository.findById("ADMIN").orElseThrow();
            User admin = User.builder()
                    .username("admin")
                    .email("admin@fintrack.com")
                    .fullName("System Administrator")
                    .password(passwordEncoder.encode("123456"))
                    .roles(new HashSet<>(Set.of(adminRole)))
                    .provider("LOCAL")
                    .baseCurrency("VND")
                    .deleted(false)
                    .build();
            userRepository.save(admin);
            log.info("Đã tạo tài khoản admin mặc định");
        }

        log.info("Hoàn tất seed dữ liệu.");
    }

    private Permission createPermissionIfNotFound(String name, String description) {
        return permissionRepository.findById(name).orElseGet(() -> {
            Permission permission = Permission.builder()
                    .name(name)
                    .description(description)
                    .build();
            return permissionRepository.save(permission);
        });
    }
}
