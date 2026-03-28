"use client";

import { transactionService } from "@/services/transaction.service";
import {
  TransactionCreationRequest,
  TransactionQueryParams,
  TransactionUpdateRequest,
  TransferRequest,
} from "@/types/transaction.dto";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";

const defaultParams: TransactionQueryParams = {
  page: 1,
  size: 10,
};

export function useTransactions(
  params: TransactionQueryParams = defaultParams,
) {
  const queryClient = useQueryClient();
  const [isCheckingRelated, setIsCheckingRelated] = useState(false);

  // =================================================================
  // 1. QUERY: Lấy danh sách giao dịch
  // =================================================================
  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ["transactions", params],
    queryFn: () => transactionService.getTransactions(params),

    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60, // Cache 1 phút
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
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      // Invalidate cả statistics để biểu đồ cập nhật ngay
      queryClient.invalidateQueries({ queryKey: ["statistics"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || "Tạo thất bại";
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
      queryClient.invalidateQueries({ queryKey: ["statistics"] });
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
      queryClient.invalidateQueries({ queryKey: ["statistics"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Xóa thất bại");
    },
  });

  // =================================================================
  // 5. MUTATION: Xuất Excel
  // =================================================================
  const exportMutation = useMutation({
    mutationFn: (exportParams?: TransactionQueryParams) =>
      transactionService.exportExcel(exportParams),
    onSuccess: async (blob) => {
      const fileName = `Lich_su_giao_dich_${new Date().getTime()}.xlsx`;

      try {
        // 1. CÁCH MỚI: Ép mở cửa sổ chọn chỗ lưu (Chỉ hỗ trợ Chrome, Edge, Cốc Cốc...)
        if ("showSaveFilePicker" in window) {
          const fileHandle = await (window as any).showSaveFilePicker({
            suggestedName: fileName,
            types: [
              {
                description: "Excel File",
                accept: {
                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                    [".xlsx"],
                },
              },
            ],
          });

          // Ghi dữ liệu vào file người dùng vừa chọn
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();

          toast.success("Đã lưu file Excel thành công!");
          return; // Xong rồi thì thoát luôn
        }

        // 2. CÁCH CŨ (FALLBACK): Dành cho Safari, Firefox hoặc trình duyệt không hỗ trợ
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();

        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success("Đã tải xuống file Excel!");
      } catch (error: any) {
        // Nếu người dùng bấm "Cancel" lúc chọn thư mục thì không báo lỗi
        if (error.name !== "AbortError") {
          console.error("Lỗi khi lưu file:", error);
          toast.error("Có lỗi xảy ra khi lưu file!");
        }
      }
    },
    onError: (error: any) => {
      console.error("Export error:", error);
      toast.error("Có lỗi xảy ra khi xuất dữ liệu từ máy chủ!");
    },
  });

  // =================================================================
  // 6. MUTATION: Quét hóa đơn AI
  // =================================================================
  const scanMutation = useMutation({
    mutationFn: (payload: { file?: File; text?: string }) =>
      transactionService.scanReceipt(payload),
    onSuccess: () => {
      // toast success để bên UI lo
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message ||
        "Không thể đọc thông tin, vui lòng thử lại.";
      toast.error(msg);
    },
  });

  // =================================================================
  // 7. MUTATION: Chuyển tiền giữa các ví (CÓ POLLING NGẦM & CHUẨN TYPE)
  // =================================================================
  const transferMutation = useMutation({
    mutationFn: async (payload: TransferRequest) => {
      // 1. Gọi API chuyển tiền gốc (hàm này return response.data)
      const response = await transactionService.transfer(payload);

      // Lúc này response chính là ApiResponse, nên chỉ cần chấm tới result
      const transactionId = response.result?.id;

      if (!transactionId) return response;

      // 2. Tự động Polling ngầm hỏi thăm Backend
      let finalStatus = "PENDING";
      let attempts = 0;
      const MAX_ATTEMPTS = 10;

      while (finalStatus === "PENDING" && attempts < MAX_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        try {
          // Hàm này return response.data.result (chính là TransactionResponse)
          const checkRes = await transactionService.getTransaction(transactionId);

          // Nên chỉ cần chấm thẳng tới transferStatus
          finalStatus = checkRes?.transferStatus || "PENDING";
        } catch (error) {
          console.error("Lỗi polling ngầm:", error);
        }
        attempts++;
      }

      // 3. Ép cái status cuối cùng vào response để trả về cho onSuccess
      if (response.result) {
        response.result.transferStatus = finalStatus;
      }

      return response;
    },
    onSuccess: (data) => {
      const finalStatus = data.result?.transferStatus || "PENDING";

      if (finalStatus === "COMPLETED") {
        toast.success("Chuyển tiền nội bộ thành công!");
      } else if (finalStatus === "COMPENSATED") {
        toast.error("Lỗi kết nối ví đích. Hệ thống đã hoàn tiền an toàn!");
      } else {
        toast.warning("Hệ thống đang xử lý ngầm. Vui lòng kiểm tra lại sau.");
      }

      // Vòng lặp xong xuôi mới gọi Invalidate để web tải lại số dư & biểu đồ
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["statistics"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || "Chuyển tiền thất bại";
      toast.error(msg);
    },
  });

  // =================================================================
  // 8. HELPER: Kiểm tra giao dịch liên quan
  // =================================================================
  const checkRelatedTransactions = async (categoryId: string) => {
    setIsCheckingRelated(true);
    try {
      const res = await transactionService.getTransactions({
        page: 1,
        size: 5,
        categoryId: categoryId,
        // Lưu ý: Ở đây có thể cần truyền thêm walletId nếu backend bắt buộc
      });
      return res?.data || [];
    } catch (error) {
      console.error("Lỗi check giao dịch:", error);
      return [];
    } finally {
      setIsCheckingRelated(false);
    }
  };

  return {
    data: data?.data || [],
    totalPages: data?.totalPages || 0,
    totalElements: data?.totalElements || 0,
    isLoading,
    isPlaceholderData,
    createTransaction: createMutation.mutateAsync,
    updateTransaction: updateMutation.mutateAsync,
    deleteTransaction: deleteMutation.mutateAsync,
    exportTransactions: exportMutation.mutateAsync,
    scanReceipt: scanMutation.mutateAsync,
    transferTransaction: transferMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isExporting: exportMutation.isPending,
    isScanning: scanMutation.isPending,
    isTransferring: transferMutation.isPending,
    checkRelatedTransactions,
    isCheckingRelated,
  };
}
