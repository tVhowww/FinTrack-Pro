package com.fintrack.identity_service.mapper;

import com.fintrack.identity_service.dto.request.ProfileUpdateRequest;
import com.fintrack.identity_service.dto.request.UserCreationRequest;
import com.fintrack.identity_service.dto.response.UserResponse;
import com.fintrack.identity_service.entity.User;
import org.mapstruct.*;

// componentModel = "spring" giúp bạn có thể @Autowired mapper này vào Service
@Mapper(componentModel = "spring")
public interface UserMapper {
    // 1. Chuyển từ Request DTO -> Entity (Dùng khi đăng ký)
    @Mapping(target = "roles", ignore = true)
    User toUser(UserCreationRequest request);

    // 2. Chuyển từ Entity -> Response DTO (Dùng khi trả về cho user - làm sau)
    UserResponse toUserResponse(User user);

    // @MappingTarget: báo cho MapStruct biết là update vào đối tượng 'user' có sẵn
    // NullValuePropertyMappingStrategy.IGNORE: Field nào null thì bỏ qua, không set null vào entity
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateUser(@MappingTarget User user, ProfileUpdateRequest request);
}
