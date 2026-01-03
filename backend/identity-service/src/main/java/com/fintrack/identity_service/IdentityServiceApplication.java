package com.fintrack.identity_service;

import com.fintrack.identity_service.entity.Permission;
import com.fintrack.identity_service.entity.Role;
import com.fintrack.identity_service.entity.User;
import com.fintrack.identity_service.repository.PermissionRepository;
import com.fintrack.identity_service.repository.RoleRepository;
import com.fintrack.identity_service.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;
import java.util.Set;

@SpringBootApplication
public class IdentityServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(IdentityServiceApplication.class, args);
	}

//	@Bean
//	CommandLineRunner initDatabase(UserRepository userRepository,
//								   RoleRepository roleRepository,
//								   PermissionRepository permissionRepository,
//								   PasswordEncoder passwordEncoder) {
//		return args -> {
//			// 1. Tạo các Permission cốt lõi (Nạp lần lượt vào DB)
//			// --- Identity ---
//			Permission userRead = permissionRepository.save(Permission.builder().name("USER_READ").description("Xem thông tin user").build());
//			Permission userUpdate = permissionRepository.save(Permission.builder().name("USER_UPDATE").description("Sửa thông tin user").build());
//			Permission roleManage = permissionRepository.save(Permission.builder().name("ROLE_MANAGE").description("Quản lý Role/Permission").build());
//
//			// --- Wallet (Ví) ---
//			Permission walletCreate = permissionRepository.save(Permission.builder().name("WALLET_CREATE").description("Tạo ví mới").build());
//			Permission walletRead = permissionRepository.save(Permission.builder().name("WALLET_READ").description("Xem danh sách ví").build());
//			Permission walletUpdate = permissionRepository.save(Permission.builder().name("WALLET_UPDATE").description("Sửa ví").build());
//			Permission walletDelete = permissionRepository.save(Permission.builder().name("WALLET_DELETE").description("Xóa ví").build());
//
//			// --- Transaction (Giao dịch) ---
//			Permission txCreate = permissionRepository.save(Permission.builder().name("TX_CREATE").description("Tạo giao dịch").build());
//			Permission txRead = permissionRepository.save(Permission.builder().name("TX_READ").description("Xem giao dịch").build());
//
//			// 2. Định nghĩa Role ADMIN (Quản trị hệ thống)
//			if (roleRepository.findById("ADMIN").isEmpty()) {
//				Set<Permission> adminPermissions = new HashSet<>();
//				adminPermissions.add(userRead);
//				adminPermissions.add(userUpdate);
//				adminPermissions.add(roleManage);
//				// Admin SaaS thường không can thiệp ví user, nhưng có thể xem thống kê
//
//				roleRepository.save(Role.builder().name("ADMIN").description("System Admin").permissions(adminPermissions).build());
//			}
//
//			// 3. Định nghĩa Role USER (Người dùng phổ thông)
//			if (roleRepository.findById("USER").isEmpty()) {
//				Set<Permission> userPermissions = new HashSet<>();
//				userPermissions.add(userRead); // Xem profile chính mình
//				userPermissions.add(userUpdate); // Sửa profile chính mình
//
//				// Full quyền với Ví và Giao dịch của chính họ
//				userPermissions.add(walletCreate);
//				userPermissions.add(walletRead);
//				userPermissions.add(walletUpdate);
//				userPermissions.add(walletDelete);
//				userPermissions.add(txCreate);
//				userPermissions.add(txRead);
//
//				roleRepository.save(Role.builder().name("USER").description("Standard User").permissions(userPermissions).build());
//			}
//
//			// 4. Tạo tài khoản Admin mặc định
//			if (userRepository.findByUsername("admin").isEmpty()) {
//				Role adminRole = roleRepository.findById("ADMIN").orElse(null);
//				User admin = User.builder()
//						.username("admin")
//						.email("admin@fintrack.com")
//						.fullName("System Administrator")
//						.password(passwordEncoder.encode("123456"))
//						.roles(new HashSet<>(Set.of(adminRole)))
//						.build();
//				userRepository.save(admin);
//			}
//		};
//	}

}
