package com.fintrack.identity_service.controller;

import com.fintrack.identity_service.dto.request.*;
import com.fintrack.identity_service.dto.response.ApiResponse;
import com.fintrack.identity_service.dto.response.AuthenticationResponse;
import com.fintrack.identity_service.dto.response.IntrospectResponse;
import com.fintrack.identity_service.exception.AppException;
import com.fintrack.identity_service.exception.ErrorCode;
import com.fintrack.identity_service.service.AuthenticationService;
import com.fintrack.identity_service.utils.CookieUtils;
import com.nimbusds.jose.JOSEException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.text.ParseException;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AuthenticationService authenticationService;
    private final CookieUtils cookieUtils;

    // -------------------------------------------------------------------------
    // POST /auth/token  —  Username/password login
    // -------------------------------------------------------------------------
    @PostMapping("/token")
    public ApiResponse<AuthenticationResponse> authenticate(
            @RequestBody AuthenticationRequest request,
            HttpServletResponse response) {

        var result = authenticationService.authenticate(request);
        // Deliver token via HttpOnly cookie — NOT in the response body
        cookieUtils.setAuthCookie(response, result.getToken());

        return ApiResponse.<AuthenticationResponse>builder()
                .result(AuthenticationResponse.builder().authenticated(true).build())
                .build();
    }

    // -------------------------------------------------------------------------
    // POST /auth/google  —  Google OAuth2 login
    // -------------------------------------------------------------------------
    @PostMapping("/google")
    public ApiResponse<AuthenticationResponse> authenticateWithGoogle(
            @RequestBody GoogleLoginRequest request,
            HttpServletResponse response) {

        var result = authenticationService.authenticateWithGoogle(request);
        cookieUtils.setAuthCookie(response, result.getToken());

        return ApiResponse.<AuthenticationResponse>builder()
                .result(AuthenticationResponse.builder().authenticated(true).build())
                .build();
    }

    // -------------------------------------------------------------------------
    // POST /auth/refresh  —  Silent token refresh (reads cookie, sets new cookie)
    // -------------------------------------------------------------------------
    @PostMapping("/refresh")
    public ApiResponse<AuthenticationResponse> refreshToken(
            HttpServletRequest request,
            HttpServletResponse response) throws ParseException, JOSEException {

        String token = cookieUtils.extractTokenFromCookie(request);
        if (token == null || token.isBlank()) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        // Pass the token to the service via RefreshTokenRequest (service is unchanged)
        var result = authenticationService.refreshToken(
                RefreshTokenRequest.builder().token(token).build());

        // Issue the rotated token as a new cookie
        cookieUtils.setAuthCookie(response, result.getToken());

        return ApiResponse.<AuthenticationResponse>builder()
                .result(AuthenticationResponse.builder().authenticated(true).build())
                .build();
    }

    // -------------------------------------------------------------------------
    // POST /auth/logout  —  Invalidate token on server & clear cookie
    // -------------------------------------------------------------------------
    @PostMapping("/logout")
    public ApiResponse<Void> logout(
            HttpServletRequest request,
            HttpServletResponse response) throws ParseException, JOSEException {

        String token = cookieUtils.extractTokenFromCookie(request);
        if (token != null && !token.isBlank()) {
            // Invalidate on the server (blacklist in Redis)
            authenticationService.logout(LogoutRequest.builder().token(token).build());
        }
        // Always clear the cookie regardless of whether the token was valid
        cookieUtils.clearAuthCookie(response);

        return ApiResponse.<Void>builder()
                .message("Logout successful")
                .build();
    }

    // -------------------------------------------------------------------------
    // POST /auth/introspect  —  Token validity check (for internal / API Gateway use)
    // -------------------------------------------------------------------------
    @PostMapping("/introspect")
    public ApiResponse<IntrospectResponse> introspect(@RequestBody IntrospectRequest request) {
        var result = authenticationService.introspect(request);
        return ApiResponse.<IntrospectResponse>builder()
                .result(result)
                .build();
    }

    // -------------------------------------------------------------------------
    // POST /auth/forgot-password & /auth/reset-password  —  Password recovery
    // -------------------------------------------------------------------------
    @PostMapping("/forgot-password")
    public ApiResponse<Void> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        authenticationService.forgotPassword(request);
        return ApiResponse.<Void>builder()
                .message("OTP đã được gửi đến email của bạn.")
                .build();
    }

    @PostMapping("/reset-password")
    public ApiResponse<Void> resetPassword(@RequestBody ResetPasswordRequest request) {
        authenticationService.resetPassword(request);
        return ApiResponse.<Void>builder()
                .message("Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.")
                .build();
    }
}
