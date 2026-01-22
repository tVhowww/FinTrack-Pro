"use client";

import { userService } from "@/services/user.service";
import { useQuery } from "@tanstack/react-query";

export function useUser() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["me"], // Key định danh để caching
    queryFn: userService.getMyInfo,
    staleTime: 1000 * 60 * 5, // Dữ liệu được coi là mới trong 5 phút (đỡ gọi lại API nhiều)
    retry: false, // Nếu lỗi (vd: 401) thì không retry, để middleware lo việc đá ra login
  });

  return {
    user: data?.result, // Trả về object UserResponse
    isLoading,
    error,
    isAuthenticated: !!data?.result,
  };
}
