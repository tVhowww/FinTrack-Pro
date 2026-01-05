package com.fintrack.identity_service.service;

import com.fintrack.identity_service.dto.request.PermissionRequest;
import com.fintrack.identity_service.dto.response.PermissionResponse;
import com.fintrack.identity_service.entity.Permission;
import com.fintrack.identity_service.mapper.PermissionMapper;
import com.fintrack.identity_service.repository.PermissionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(value = MockitoExtension.class)
public class PermissionServiceTest {

    @Mock
    private PermissionRepository permissionRepository;

    @Mock
    private PermissionMapper permissionMapper;

    @InjectMocks
    private PermissionService permissionService;

    private PermissionRequest request;
    private PermissionResponse response;
    private Permission permission;

    @BeforeEach
    void initData() {
        // Chuẩn bị dữ liệu mẫu
        request = PermissionRequest.builder()
                .name("CREATE_POST")
                .description("Quyền tạo bài viết")
                .build();

        response = PermissionResponse.builder()
                .name("CREATE_POST")
                .description("Quyền tạo bài viết")
                .build();

        permission = Permission.builder()
                .name("CREATE_POST")
                .description("Quyền tạo bài viết")
                .build();
    }

    @Test
    void create_ValidRequest_Success() {
        // GIVEN
        when(permissionMapper.toPermission(any(PermissionRequest.class))).thenReturn(permission);
        when(permissionRepository.save(any(Permission.class))).thenReturn(permission);
        when(permissionMapper.toPermissionResponse(any(Permission.class))).thenReturn(response);

        // WHEN
        var result = permissionService.create(request);

        // THEN
        assertNotNull(result);
        assertEquals("CREATE_POST", result.getName());
        assertEquals("Quyền tạo bài viết", result.getDescription());
    }

    @Test
    void getAll_Success() {
        // GIVEN
        List<Permission> permissions = List.of(permission);
        when(permissionRepository.findAll()).thenReturn(permissions);
        when(permissionMapper.toPermissionResponse(any(Permission.class))).thenReturn(response);

        // WHEN
        var result = permissionService.getAll();

        // THEN
        assertNotNull(result);
        assertEquals(1, result.size()); // List trả về phải có 1 phần tử
    }

    @Test
    void delete_Success() {
        // GIVEN
        String permissionName = "CREATE_POST";
        doNothing().when(permissionRepository).deleteById(permissionName);

        // WHEN
        permissionService.delete(permissionName);

        // THEN
        // Kiểm tra xem hàm deleteById có được gọi đúng 1 lần không
        verify(permissionRepository, times(1)).deleteById(permissionName);
    }

    @Test
    void update_ValidRequest_Success() {
        // GIVEN
        String permissionName = "CREATE_POST";
        PermissionRequest updateReq = PermissionRequest.builder()
                .description("Mô tả đã sửa")
                .build();

        Permission updatedPermission = Permission.builder()
                .name("CREATE_POST")
                .description("Mô tả đã sửa")
                .build();

        PermissionResponse updatedResponse = PermissionResponse.builder()
                .name("CREATE_POST")
                .description("Mô tả đã sửa")
                .build();

        // Giả lập tìm thấy permission cũ
        when(permissionRepository.findById(permissionName)).thenReturn(Optional.of(permission));
        // Giả lập save permission mới
        when(permissionRepository.save(any(Permission.class))).thenReturn(updatedPermission);
        when(permissionMapper.toPermissionResponse(any(Permission.class))).thenReturn(updatedResponse);

        // WHEN
        var result = permissionService.update(permissionName, updateReq);

        // THEN
        assertEquals("Mô tả đã sửa", result.getDescription());
    }

    @Test
    void update_NotFound_Fail() {
        // GIVEN
        String permissionName = "NON_EXISTED";
        PermissionRequest updateReq = PermissionRequest.builder().description("New Desc").build();

        // Giả lập không tìm thấy -> Trả về Empty
        when(permissionRepository.findById(permissionName)).thenReturn(Optional.empty());

        // WHEN & THEN
        // Vì trong code Service bạn dùng .orElseThrow() mặc định -> Nó sẽ ném NoSuchElementException
        assertThrows(NoSuchElementException.class,
                () -> permissionService.update(permissionName, updateReq));
    }
}
