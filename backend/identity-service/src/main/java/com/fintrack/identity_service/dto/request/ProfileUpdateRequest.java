package com.fintrack.identity_service.dto.request;

import lombok.Data;

import java.time.LocalDate;

@Data
public class ProfileUpdateRequest {
    private String fullName;
    private LocalDate dob;
    private String phoneNumber;
    private String city;
    private String baseCurrency;
}