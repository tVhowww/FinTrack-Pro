import http from "@/lib/http";

import {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UserResponse,
} from "@/types/auth.dto";

export const authService = {
  // Đăng nhập: POST /identity/auth/token
  login: async (data: LoginRequest) => {
    const response = await http.post<ApiResponse<AuthResponse>>(
      "/identity/auth/token",
      data
    );
    return response.data;
  },

  // Đăng ký: POST /identity/users
  register: async (data: RegisterRequest) => {
    const response = await http.post<ApiResponse<UserResponse>>(
      "/identity/users",
      data
    );
    return response.data;
  },

  // Logout (Xóa token ở client)
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      window.location.href = "/login";
    }
  },
};
