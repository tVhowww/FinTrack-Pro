import http from "@/lib/http";
import Cookies from "js-cookie";
import {
  AuthResponse,
  LoginRequest,
  LogoutRequest,
  RegisterRequest,
  ResetPasswordRequest,
  UserResponse,
} from "@/types/auth.dto";
import { ApiResponse } from "@/types/api";

export const authService = {
  // Đăng nhập: POST /identity/auth/token
  login: async (data: LoginRequest) => {
    const response = await http.post<ApiResponse<AuthResponse>>(
      "/identity/auth/token",
      data,
    );
    return response.data;
  },

  // Đăng ký: POST /identity/users
  register: async (data: RegisterRequest) => {
    const response = await http.post<ApiResponse<UserResponse>>(
      "/identity/users",
      data,
    );
    return response.data;
  },

  // Logout (Xóa token ở client)
  logout: async () => {
    // 1. Lấy token từ LocalStorage
    const token = localStorage.getItem("accessToken");

    // 2. Nếu có token, gọi API để hủy trên server
    if (token) {
      try {
        await http.post<ApiResponse<void>>("/identity/auth/logout", {
          token: token,
        } as LogoutRequest);
      } catch (error) {
        // Nếu lỗi (VD token hết hạn rồi), ta cứ lờ đi và logout ở client luôn
        console.error("Logout API failed", error);
      }
    }

    // 3. Xóa sạch dấu vết Client (LocalStorage + Cookie)
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      Cookies.remove("accessToken");

      // 4. Redirect về login
      window.location.href = "/login";
    }
  },

  // Yêu cầu quên mật khẩu
  forgotPassword: async (email: string) => {
    const response = await http.post<ApiResponse<void>>(
      "/identity/auth/forgot-password",
      { email },
    );
    return response.data;
  },

  // Đặt lại mật khẩu với OTP
  resetPassword: async (data: ResetPasswordRequest) => {
    const response = await http.post<ApiResponse<void>>(
      "/identity/auth/reset-password",
      data,
    );
    return response.data;
  },

  loginGoogle: async (token: string) => {
    const response = await http.post<ApiResponse<any>>(
      "/identity/auth/google",
      { token },
    );
    return response.data;
  },
};
