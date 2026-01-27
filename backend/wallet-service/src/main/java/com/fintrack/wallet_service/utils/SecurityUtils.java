package com.fintrack.wallet_service.utils;

import com.fintrack.wallet_service.exception.AppException;
import com.fintrack.wallet_service.exception.ErrorCode;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

public class SecurityUtils {

    // Private constructor để chặn việc khởi tạo class này (vì chỉ dùng hàm static)
    private SecurityUtils() {}

    /**
     * Lấy UserID từ SecurityContext hiện tại (JWT Token)
     */
    public static String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new com.fintrack.wallet_service.exception.AppException(ErrorCode.UNAUTHENTICATED);
        }

        Object principal = authentication.getPrincipal();

        // Kiểm tra xem principal có phải là JWT không (đề phòng trường hợp AnonymousUser)
        if (principal instanceof Jwt jwt) {
            // Lấy claim "userId"
            String userId = jwt.getClaimAsString("userId");

            if (userId == null) {
                // Trường hợp Token hợp lệ nhưng không có claim userId
                throw new AppException(ErrorCode.UNAUTHENTICATED);
            }
            return userId;
        }

        throw new AppException(ErrorCode.UNAUTHENTICATED);
    }
}