package com.fintrack.identity_service.service;

import com.fintrack.identity_service.dto.request.RoleRequest;
import com.fintrack.identity_service.dto.response.PermissionResponse;
import com.fintrack.identity_service.dto.response.RoleResponse;
import com.fintrack.identity_service.entity.Role;
import com.fintrack.identity_service.exception.AppException;
import com.fintrack.identity_service.exception.ErrorCode;
import com.fintrack.identity_service.mapper.RoleMapper;
import com.fintrack.identity_service.repository.PermissionRepository;
import com.fintrack.identity_service.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RoleService {
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final RoleMapper roleMapper;

    public RoleResponse create(RoleRequest request) {

        var role = roleMapper.toRole(request);

        var permissions = permissionRepository.findAllById(request.getPermissions());
        role.setPermissions(new HashSet<>(permissions));

        role = roleRepository.save(role);

        return roleMapper.toRoleResponse(role);
    }

    public RoleResponse update(String roleName, RoleRequest request) {
        // 1. Tìm Role trong DB, không thấy thì báo lỗi
        var role = roleRepository.findById(roleName)
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_EXISTED));

        // 2. Tìm danh sách Permission từ request gửi lên
        var permissions = permissionRepository.findAllById(request.getPermissions());

        // 3. Cập nhật thông tin (Description và List Permission mới)
        role.setDescription(request.getDescription());
        role.setPermissions(new HashSet<>(permissions));

        // 4. Lưu lại
        role = roleRepository.save(role);

        return roleMapper.toRoleResponse(role);
    }

    public List<RoleResponse> getAll() {
        return roleRepository.findAll().stream()
                .map(roleMapper::toRoleResponse)
                .toList();
    }

    public void delete(String roleName) {
        roleRepository.deleteById(roleName);
    }
}
