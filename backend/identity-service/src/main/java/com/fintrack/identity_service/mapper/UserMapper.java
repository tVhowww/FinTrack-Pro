package com.fintrack.identity_service.mapper;

import com.fintrack.identity_service.dto.request.UserCreationRequest;
import com.fintrack.identity_service.dto.response.UserResponse;
import com.fintrack.identity_service.entity.User;
import org.mapstruct.Mapper;

// componentModel = "spring" giúp bạn có thể @Autowired mapper này vào Service
@Mapper(componentModel = "spring")
public interface UserMapper {
    // 1. Chuyển từ Request DTO -> Entity (Dùng khi đăng ký)
    User toUser(UserCreationRequest request);

    // 2. Chuyển từ Entity -> Response DTO (Dùng khi trả về cho user - làm sau)
    UserResponse toUserResponse(User user);
}
