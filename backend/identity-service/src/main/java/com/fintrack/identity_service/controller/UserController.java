package com.fintrack.identity_service.controller;

import com.fintrack.identity_service.dto.request.PasswordChangeRequest;
import com.fintrack.identity_service.dto.request.ProfileUpdateRequest;
import com.fintrack.identity_service.dto.request.UserCreationRequest;
import com.fintrack.identity_service.dto.response.ApiResponse;
import com.fintrack.identity_service.dto.response.UserResponse;
import com.fintrack.identity_service.entity.User;
import com.fintrack.identity_service.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @PutMapping("/my-profile")
    ApiResponse<UserResponse> updateProfile(@RequestBody ProfileUpdateRequest request) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.updateProfile(request))
                .build();
    }

    @PatchMapping("/change-password")
    ApiResponse<String> changePassword(@RequestBody @Valid PasswordChangeRequest request) {
        userService.changePassword(request);
        return ApiResponse.<String>builder()
                .result("Đổi mật khẩu thành công")
                .build();
    }

    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ApiResponse<UserResponse> uploadAvatar(@RequestParam("file") MultipartFile file) {
        // Mock: Giả sử đã upload file và có URL
        // String fileUrl = storageService.upload(file);
        // Tạm thời hardcode để test flow DB
        String mockUrl = "https://example.com/avatars/" + file.getOriginalFilename();

        return ApiResponse.<UserResponse>builder()
                .result(userService.updateAvatar(mockUrl))
                .build();
    }

    @GetMapping
    @PreAuthorize("hasAuthority('USER_READ')")
    public List<User> getUsers() {
        return userService.getUsers();
    }

    @PostMapping
    public ApiResponse<UserResponse> createUser(@RequestBody @Valid UserCreationRequest request) {
        ApiResponse<UserResponse> apiResponse = new ApiResponse<>();

        apiResponse.setResult(userService.createUser(request));

        return apiResponse;
    }

    @GetMapping("/{userId}")
    @PreAuthorize("hasAuthority('USER_READ')")
    ApiResponse<UserResponse> getUser(@PathVariable("userId") String userId) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.getUser(userId))
                .build();
    }

    @GetMapping("/my-info")
    ApiResponse<UserResponse> getMyInfo() {
        return ApiResponse.<UserResponse>builder()
                .result(userService.getMyInfo())
                .build();
    }
}
