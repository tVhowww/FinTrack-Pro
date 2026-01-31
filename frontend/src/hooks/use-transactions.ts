"use client";

import { transactionService } from "@/services/transaction.service";
import {
  TransactionCreationRequest,
  TransactionQueryParams,
  TransactionUpdateRequest,
} from "@/types/transaction.dto";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";

// Params mặc định để tránh lỗi undefined khi khởi tạo
const defaultParams: TransactionQueryParams = {
  page: 1,
  size: 10,
};

export function useTransactions(
  params: TransactionQueryParams = defaultParams,
) {
  const queryClient = useQueryClient();

  // State riêng cho việc check related transactions (dùng cho Category Page)
  const [isCheckingRelated, setIsCheckingRelated] = useState(false);

  // =================================================================
  // 1. QUERY: Lấy danh sách giao dịch
  // =================================================================
  const { data, isLoading, isPlaceholderData } = useQuery({
    // Khi params thay đổi (page, size, filter...), queryKey đổi -> Tự động gọi lại API
    queryKey: ["transactions", params],
    queryFn: () => transactionService.getTransactions(params),
    // Giữ data cũ trong khi đang fetch trang mới -> Giúp bảng không bị nhấp nháy (UX tốt hơn)
    placeholderData: (previousData) => previousData,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // =================================================================
  // 2. MUTATION: Tạo giao dịch mới
  // =================================================================
  const createMutation = useMutation({
    mutationFn: (data: TransactionCreationRequest) =>
      transactionService.create(data),
    onSuccess: () => {
      toast.success("Tạo giao dịch thành công");
      // Refresh danh sách giao dịch
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      // QUAN TRỌNG: Refresh lại số dư ví (vì giao dịch làm thay đổi tiền)
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || "Tạo thất bại";
      // Xử lý thông báo lỗi số dư tiếng Việt cho thân thiện
      if (msg.includes("Insufficient balance") || msg.includes("2005")) {
        toast.error("Số dư ví không đủ để thực hiện giao dịch này!");
      } else {
        toast.error(msg);
      }
    },
  });

  // =================================================================
  // 3. MUTATION: Cập nhật giao dịch
  // =================================================================
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: TransactionUpdateRequest;
    }) => transactionService.update(id, data),
    onSuccess: () => {
      toast.success("Cập nhật thành công");
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || "Cập nhật thất bại";
      toast.error(msg);
    },
  });

  // =================================================================
  // 4. MUTATION: Xóa giao dịch
  // =================================================================
  const deleteMutation = useMutation({
    mutationFn: transactionService.delete,
    onSuccess: () => {
      toast.success("Đã xóa giao dịch và hoàn tiền lại ví");
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Xóa thất bại");
    },
  });

  // =================================================================
  // 5. HELPER: Kiểm tra giao dịch liên quan (Dùng cho module Category)
  // =================================================================
  const checkRelatedTransactions = async (categoryId: string) => {
    setIsCheckingRelated(true);
    try {
      // Lấy 5 giao dịch mới nhất thuộc category này để preview
      const res = await transactionService.getTransactions({
        page: 1,
        size: 5,
        categoryId: categoryId,
      });
      return res?.data || [];
    } catch (error) {
      console.error("Lỗi check giao dịch:", error);
      toast.error("Không thể kiểm tra dữ liệu liên quan.");
      return [];
    } finally {
      setIsCheckingRelated(false);
    }
  };

  return {
    // Data list
    data: data?.data || [],
    totalPages: data?.totalPages || 0,
    totalElements: data?.totalElements || 0,

    // Status
    isLoading, // Loading của Query (Get List)
    isPlaceholderData, // Đang load trang tiếp theo nhưng vẫn hiện data cũ

    // Actions (Mutations)
    createTransaction: createMutation.mutateAsync,
    updateTransaction: updateMutation.mutateAsync,
    deleteTransaction: deleteMutation.mutateAsync,

    // Loading states của actions
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    // Helper cho Category
    checkRelatedTransactions,
    isCheckingRelated,
  };
}
