import http from "@/lib/http";
import { ApiResponse } from "@/types/api";
import {
  PasswordChangeRequest,
  ProfileUpdateRequest,
  UserResponse,
} from "@/types/user.dto";

// Prefix chung cho identity service
const BASE_URL = "/identity/users";

export const userService = {
  // Lấy thông tin user (Cũ)
  getMyInfo: async () => {
    const response = await http.get<ApiResponse<UserResponse>>(
      `${BASE_URL}/my-info`,
    );
    return response.data;
  },

  // Cập nhật thông tin (Mới)
  updateProfile: async (data: ProfileUpdateRequest) => {
    const response = await http.put<ApiResponse<UserResponse>>(
      `${BASE_URL}/my-profile`,
      data,
    );
    return response.data;
  },

  // Đổi mật khẩu (Mới)
  changePassword: async (data: PasswordChangeRequest) => {
    const response = await http.patch<ApiResponse<string>>(
      `${BASE_URL}/change-password`,
      data,
    );
    return response.data;
  },

  // Upload Avatar (Mới)
  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file); // Key phải là "file" giống Controller

    const response = await http.post<ApiResponse<UserResponse>>(
      `${BASE_URL}/avatar`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  },

  // Xóa tài khoản (Mới)
  deleteAccount: async () => {
    const response = await http.delete<ApiResponse<string>>(
      `${BASE_URL}/my-account`,
    );
    return response.data;
  },
};
