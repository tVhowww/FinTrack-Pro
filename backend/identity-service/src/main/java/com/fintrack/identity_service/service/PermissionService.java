package com.fintrack.identity_service.service;

import com.fintrack.identity_service.dto.request.PermissionRequest;
import com.fintrack.identity_service.dto.response.PermissionResponse;
import com.fintrack.identity_service.entity.Permission;
import com.fintrack.identity_service.mapper.PermissionMapper;
import com.fintrack.identity_service.repository.PermissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PermissionService {
    private final PermissionRepository permissionRepository;
    private final PermissionMapper permissionMapper;

    public PermissionResponse create(PermissionRequest request) {
        Permission permission = permissionMapper.toPermission(request);

        permission = permissionRepository.save(permission);

        return permissionMapper.toPermissionResponse(permission);
    }

    public PermissionResponse update(String permissionName, PermissionRequest request) {
        var permission = permissionRepository.findById(permissionName)
                .orElseThrow();

        permission.setDescription(request.getDescription());

        permission = permissionRepository.save(permission);

        return permissionMapper.toPermissionResponse(permission);
    }

    public List<PermissionResponse> getAll() {
        var permissions = permissionRepository.findAll();
        return permissions.stream()
                .map(permissionMapper::toPermissionResponse)
                .toList();
    }

    public void delete(String permission) {
        permissionRepository.deleteById(permission);
    }
}
