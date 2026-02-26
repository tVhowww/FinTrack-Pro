package com.fintrack.identity_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.Set;


@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "users")
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(name = "full_name")
    private String fullName;

    private LocalDate dob;

    @Column(name = "phone_number")
    private String phoneNumber;

    private String city;

    private String avatar;

    @Column(name = "base_currency")
    @Builder.Default
    private String baseCurrency = "VND";

    @Builder.Default
    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean deleted = false;

    @Column(name = "current_jwt_id")
    private String currentJwtId; // Lưu JTI của token hợp lệ cuối cùng

    @Column(name = "provider")
    @Builder.Default
    private String provider = "LOCAL"; // LOCAL, GOOGLE, FACEBOOK

    @Column(name = "provider_id")
    private String providerId; // Chứa ID định danh của Google/Facebook

    @ManyToMany
    @JoinTable(
            name = "user_roles", // Tên bảng trung gian
            joinColumns = @JoinColumn(name = "user_id"), // Khóa ngoại trỏ về User
            inverseJoinColumns = @JoinColumn(name = "role_name") // Khóa ngoại trỏ về Role
    )
    private Set<Role> roles;
}
