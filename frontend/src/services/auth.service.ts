import http from "@/lib/http";
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  UserResponse,
} from "@/types/auth.dto";
import { ApiResponse } from "@/types/api";

export const authService = {
  // POST /identity/auth/token
  // The server sets an HttpOnly 'access_token' cookie in the Set-Cookie header.
  // This function simply returns { authenticated: true } — no token in the body.
  login: async (data: LoginRequest) => {
    const response = await http.post<ApiResponse<AuthResponse>>(
      "/identity/auth/token",
      data
    );
    return response.data;
  },

  // POST /identity/users
  register: async (data: RegisterRequest) => {
    const response = await http.post<ApiResponse<UserResponse>>(
      "/identity/users",
      data
    );
    return response.data;
  },

  // POST /identity/auth/logout
  // Sends an empty body. The backend reads the token from the HttpOnly cookie,
  // blacklists it in Redis, then instructs the browser to clear the cookie (Max-Age=0).
  logout: async () => {
    try {
      await http.post<ApiResponse<void>>("/identity/auth/logout", {});
    } catch (error) {
      // Even if the API call fails, we still redirect — the cookie will expire naturally.
      console.error("Logout API failed", error);
    }
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  },

  // POST /identity/auth/forgot-password
  forgotPassword: async (email: string) => {
    const response = await http.post<ApiResponse<void>>(
      "/identity/auth/forgot-password",
      { email }
    );
    return response.data;
  },

  // POST /identity/auth/reset-password
  resetPassword: async (data: ResetPasswordRequest) => {
    const response = await http.post<ApiResponse<void>>(
      "/identity/auth/reset-password",
      data
    );
    return response.data;
  },

  // POST /identity/auth/google
  // Same cookie flow as regular login — server sets HttpOnly cookie.
  loginGoogle: async (token: string) => {
    const response = await http.post<ApiResponse<AuthResponse>>(
      "/identity/auth/google",
      { token }
    );
    return response.data;
  },
};
