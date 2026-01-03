package com.fintrack.identity_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "roles")
public class Role {
    @Id
    private String name;

    private String description;

    @ManyToMany(fetch = FetchType.EAGER) // Load Role là load luôn quyền
    @JoinTable(
            name = "role_permissions", // Tên bảng trung gian
            joinColumns = @JoinColumn(name = "role_name"), // Khóa ngoại trỏ về Role
            inverseJoinColumns = @JoinColumn(name = "permission_name") // Khóa ngoại trỏ về Permission
    )
    private Set<Permission> permissions;
}
