package com.fintrack.identity_service.controller;

import com.fintrack.identity_service.dto.request.PermissionRequest;
import com.fintrack.identity_service.dto.response.ApiResponse;
import com.fintrack.identity_service.dto.response.PermissionResponse;
import com.fintrack.identity_service.service.PermissionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/permissions")
@RequiredArgsConstructor
@Slf4j
public class PermissionController {
    private final PermissionService permissionService;

    @PreAuthorize("hasAuthority('PERMISSION_CREATE')")
    @PostMapping
    ApiResponse<PermissionResponse> create(@RequestBody PermissionRequest request) {
        return ApiResponse.<PermissionResponse>builder()
                .result(permissionService.create(request))
                .build();
    }

    @PreAuthorize("hasAuthority('PERMISSION_UPDATE')")
    @PutMapping("/{permission}")
    ApiResponse<PermissionResponse> update(@PathVariable String permission, @RequestBody PermissionRequest request) {
        return ApiResponse.<PermissionResponse>builder()
                .result(permissionService.update(permission, request))
                .build();
    }

    @PreAuthorize("hasAuthority('PERMISSION_READ')")
    @GetMapping
    ApiResponse<List<PermissionResponse>> getAll() {
        return ApiResponse.<List<PermissionResponse>>builder()
                .result(permissionService.getAll())
                .build();
    }

    @PreAuthorize("hasAuthority('PERMISSION_DELETE')")
    @DeleteMapping("/{permission}")
    ApiResponse<Void> delete(@PathVariable String permission) {
        permissionService.delete(permission);
        return ApiResponse.<Void>builder().build();
    }


}
