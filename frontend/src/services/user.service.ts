import http from "@/lib/http";
import { ApiResponse, UserResponse } from "@/types/auth.dto";

export const userService = {
  getMyInfo: async () => {
    const response = await http.get<ApiResponse<UserResponse>>("/identity/users/my-info");
    return response.data;
  },
};