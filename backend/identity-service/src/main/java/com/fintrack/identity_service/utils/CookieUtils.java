package com.fintrack.identity_service.utils;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

/**
 * Centralizes all HttpOnly cookie operations for the authentication token.
 * The 'secure' flag is environment-driven: false for local HTTP dev, true for HTTPS prod.
 */
@Component
public class CookieUtils {

    public static final String COOKIE_NAME = "access_token";
    private static final int COOKIE_MAX_AGE_SECONDS = 3600; // 1 hour — matches JWT expiry

    @Value("${app.cookie.secure:false}")
    private boolean secure;

    /**
     * Writes the JWT as an HttpOnly cookie on the response.
     * @param response the current HttpServletResponse
     * @param token    the signed JWT string
     */
    public void setAuthCookie(HttpServletResponse response, String token) {
        ResponseCookie cookie = ResponseCookie.from(COOKIE_NAME, token)
                .httpOnly(true)
                .secure(secure)
                .sameSite(secure ? "None" : "Lax")
                .path("/")
                .maxAge(COOKIE_MAX_AGE_SECONDS)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    /**
     * Overwrites the auth cookie with an empty value and Max-Age=0, effectively deleting it.
     * @param response the current HttpServletResponse
     */
    public void clearAuthCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(COOKIE_NAME, "")
                .httpOnly(true)
                .secure(secure)
                .sameSite(secure ? "None" : "Lax")
                .path("/")
                .maxAge(0)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    /**
     * Reads the JWT value from the incoming request's cookies.
     * @param request the current HttpServletRequest
     * @return the token string, or null if not found
     */
    public String extractTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        for (Cookie cookie : request.getCookies()) {
            if (COOKIE_NAME.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
