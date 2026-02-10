"use client";

import { userService } from "@/services/user.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export function useUser() {
  const queryClient = useQueryClient();
  const router = useRouter();

  // 1. Query lấy thông tin (Code cũ của bạn)
  const { data, isLoading, error } = useQuery({
    queryKey: ["me"],
    queryFn: userService.getMyInfo,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  // 2. Mutation Cập nhật Profile
  const updateProfileMutation = useMutation({
    mutationFn: userService.updateProfile,
    onSuccess: () => {
      toast.success("Cập nhật hồ sơ thành công!");
      queryClient.invalidateQueries({ queryKey: ["me"] }); // Load lại data mới
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Lỗi cập nhật hồ sơ");
    },
  });

  // 3. Mutation Đổi Mật Khẩu
  const changePasswordMutation = useMutation({
    mutationFn: userService.changePassword,
    onSuccess: () => {
      toast.success("Đổi mật khẩu thành công!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Lỗi đổi mật khẩu");
    },
  });

  // 4. Mutation Upload Avatar
  const uploadAvatarMutation = useMutation({
    mutationFn: userService.uploadAvatar,
    onSuccess: () => {
      toast.success("Cập nhật ảnh đại diện thành công!");
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (error: any) => {
      toast.error("Lỗi upload ảnh");
    },
  });

  // 5. Mutation Xóa tài khoản
  const deleteAccountMutation = useMutation({
    mutationFn: userService.deleteAccount,
    onSuccess: () => {
      toast.success("Đã xóa tài khoản. Hẹn gặp lại!");
      // Xóa token và redirect
      localStorage.removeItem("accessToken");
      Cookies.remove("accessToken");
      router.push("/login");
    },
    onError: (error: any) => {
      toast.error("Không thể xóa tài khoản lúc này.");
    },
  });

  return {
    user: data?.result,
    isLoading,
    error,
    isAuthenticated: !!data?.result,
    // Export các hàm update ra ngoài để dùng
    updateProfile: updateProfileMutation.mutate,
    isUpdatingProfile: updateProfileMutation.isPending,

    changePassword: changePasswordMutation.mutate,
    isChangingPassword: changePasswordMutation.isPending,

    uploadAvatar: uploadAvatarMutation.mutate,
    isUploadingAvatar: uploadAvatarMutation.isPending,

    deleteAccount: deleteAccountMutation.mutate,
    isDeletingAccount: deleteAccountMutation.isPending,
  };
}
