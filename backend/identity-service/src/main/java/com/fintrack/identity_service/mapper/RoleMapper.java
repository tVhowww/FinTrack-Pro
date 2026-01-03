package com.fintrack.identity_service.mapper;


import com.fintrack.identity_service.dto.request.RoleRequest;
import com.fintrack.identity_service.dto.response.RoleResponse;
import com.fintrack.identity_service.entity.Role;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface RoleMapper {
    // 1. Request -> Entity
    // Lưu ý: Request gửi lên List<String> permissions (tên quyền),
    // nhưng Entity cần Set<Permission>. Việc query DB lấy Permission ta làm ở Service,
    // nên ở đây ta bảo MapStruct "Bỏ qua field permissions đi" để ta tự set tay.
    @Mapping(target = "permissions", ignore = true)
    Role toRole(RoleRequest request);

    // 2. Entity -> Response
    // MapStruct tự động map Set<Permission> sang Set<PermissionResponse>
    // nếu các field bên trong trùng tên.
    RoleResponse toRoleResponse(Role role);
}
