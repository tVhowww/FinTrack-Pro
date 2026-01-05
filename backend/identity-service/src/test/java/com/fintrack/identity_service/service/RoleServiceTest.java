package com.fintrack.identity_service.service;

import com.fintrack.identity_service.dto.request.RoleRequest;
import com.fintrack.identity_service.dto.response.PermissionResponse;
import com.fintrack.identity_service.dto.response.RoleResponse;
import com.fintrack.identity_service.entity.Permission;
import com.fintrack.identity_service.entity.Role;
import com.fintrack.identity_service.exception.AppException;
import com.fintrack.identity_service.exception.ErrorCode;
import com.fintrack.identity_service.mapper.RoleMapper;
import com.fintrack.identity_service.repository.PermissionRepository;
import com.fintrack.identity_service.repository.RoleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class RoleServiceTest {

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PermissionRepository permissionRepository; // Cần mock cái này vì Role chứa Permission

    @Mock
    private RoleMapper roleMapper;

    @InjectMocks
    private RoleService roleService;

    private RoleRequest roleRequest;
    private RoleResponse roleResponse;
    private Role role;
    private Permission permission;

    @BeforeEach
    void initData() {
        permission = Permission.builder()
                .name("CREATE_POST")
                .description("Quyền tạo bài viết")
                .build();

        roleRequest = RoleRequest.builder()
                .name("ADMIN")
                .description("Quản trị viên")
                .permissions(Set.of("CREATE_POST")) // Request gửi lên danh sách ID của permission
                .build();

        roleResponse = RoleResponse.builder()
                .name("ADMIN")
                .description("Quản trị viên")
                .permissions(Set.of(new PermissionResponse("CREATE_POST", "Quyền tạo bài viết")))
                .build();

        role = Role.builder()
                .name("ADMIN")
                .description("Quản trị viên")
                .permissions(new HashSet<>(Set.of(permission)))
                .build();
    }

    @Test
    void create_ValidRequest_Success() {
        // GIVEN
        when(roleMapper.toRole(any(RoleRequest.class))).thenReturn(role);

        // Mock hành động tìm permission từ DB
        when(permissionRepository.findAllById(any())).thenReturn(List.of(permission));

        when(roleRepository.save(any(Role.class))).thenReturn(role);
        when(roleMapper.toRoleResponse(any(Role.class))).thenReturn(roleResponse);

        // WHEN
        var result = roleService.create(roleRequest);

        // THEN
        assertNotNull(result);
        assertEquals("ADMIN", result.getName());
        assertEquals(1, result.getPermissions().size()); // Phải có 1 permission bên trong
    }

    @Test
    void getAll_Success() {
        // GIVEN
        when(roleRepository.findAll()).thenReturn(List.of(role));
        when(roleMapper.toRoleResponse(any(Role.class))).thenReturn(roleResponse);

        // WHEN
        var result = roleService.getAll();

        // THEN
        assertNotNull(result);
        assertEquals(1, result.size());
    }

    @Test
    void delete_Success() {
        // GIVEN
        String roleName = "ADMIN";
        doNothing().when(roleRepository).deleteById(roleName);

        // WHEN
        roleService.delete(roleName);

        // THEN
        verify(roleRepository, times(1)).deleteById(roleName);
    }

    // --- Test Update ---

    @Test
    void update_ValidRequest_Success() {
        // GIVEN
        String roleName = "ADMIN";

        // Request sửa description
        RoleRequest updateReq = RoleRequest.builder()
                .description("Mô tả admin mới")
                .permissions(Set.of("CREATE_POST"))
                .build();

        // Object Role sau khi sửa
        Role updatedRole = Role.builder()
                .name("ADMIN")
                .description("Mô tả admin mới")
                .permissions(new HashSet<>(Set.of(permission)))
                .build();

        RoleResponse updatedResponse = RoleResponse.builder()
                .name("ADMIN")
                .description("Mô tả admin mới")
                .build();

        // 1. Tìm thấy role cũ
        when(roleRepository.findById(roleName)).thenReturn(Optional.of(role));
        // 2. Tìm thấy permission
        when(permissionRepository.findAllById(any())).thenReturn(List.of(permission));
        // 3. Save role mới
        when(roleRepository.save(any(Role.class))).thenReturn(updatedRole);
        // 4. Map ra response
        when(roleMapper.toRoleResponse(any(Role.class))).thenReturn(updatedResponse);

        // WHEN
        var result = roleService.update(roleName, updateReq);

        // THEN
        assertEquals("Mô tả admin mới", result.getDescription());
    }

    @Test
    void update_NotFound_Fail() {
        // GIVEN
        String roleName = "NON_EXISTED";

        // Giả lập không tìm thấy role
        when(roleRepository.findById(roleName)).thenReturn(Optional.empty());

        // WHEN & THEN
        AppException exception = assertThrows(AppException.class,
                () -> roleService.update(roleName, roleRequest));

        assertEquals(ErrorCode.ROLE_NOT_EXISTED, exception.getErrorCode());
    }
}