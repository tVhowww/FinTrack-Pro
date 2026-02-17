package com.fintrack.identity_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
    private String id;
    private String username;
    private String email;
    private String fullName;
    private LocalDate dob;
    private String phoneNumber;
    private String city;
    private String avatar;
    private Set<RoleResponse> roles;
    private String baseCurrency;
}
