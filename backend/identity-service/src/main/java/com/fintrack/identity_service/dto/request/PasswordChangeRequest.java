package com.fintrack.identity_service.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PasswordChangeRequest {
    @Size(min = 6, message = "PASSWORD_INVALID")
    private String oldPassword;

    @Size(min = 6, message = "PASSWORD_INVALID")
    private String newPassword;
}