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

    @Column(name = "current_jwt_id")
    private String currentJwtId; // Lưu JTI của token hợp lệ cuối cùng

    // Dùng ElementCollection để Hibernate tự tạo bảng phụ 'user_roles'
    @ElementCollection(fetch = FetchType.EAGER) // EAGER để khi query User là có luôn Role
    private Set<String> roles;
}
