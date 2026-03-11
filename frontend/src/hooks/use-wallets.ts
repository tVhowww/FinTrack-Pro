"use client";

import { walletService } from "@/services/wallet.service";
import { WalletFormValues } from "@/types/wallet.dto";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface UseWalletsParams {
  keyword?: string;
  currency?: string;
}

export function useWallets(params?: UseWalletsParams) {
  const queryClient = useQueryClient();

  // 1. Query: Lấy danh sách ví
  const { data, isLoading, error } = useQuery({
    queryKey: ["wallets", params],
    queryFn: () => walletService.getAll(params),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // 2. Mutation: Tạo ví mới
  const createMutation = useMutation({
    mutationFn: walletService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] }); // Refresh lại list
      toast.success("Tạo ví thành công!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Lỗi khi tạo ví");
    },
  });

  // 3. Mutation: Cập nhật ví
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: WalletFormValues }) =>
      walletService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      toast.success("Cập nhật ví thành công!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Lỗi khi cập nhật");
    },
  });

  const adjustBalanceMutation = useMutation({
    mutationFn: walletService.adjustBalance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] }); // Refresh lại số dư mới ngay lập tức
      toast.success("Đã điều chỉnh số dư thành công!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Lỗi khi điều chỉnh số dư");
    },
  });
  // 4. Mutation: Xóa ví
  const deleteMutation = useMutation({
    mutationFn: walletService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      toast.success("Đã xóa ví!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Lỗi khi xóa");
    },
  });

  return {
    wallets: data?.result || [],
    isLoading,
    error,
    createWallet: createMutation.mutate,
    updateWallet: updateMutation.mutate,
    deleteWallet: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    adjustBalance: adjustBalanceMutation.mutate,
    isAdjusting: adjustBalanceMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
