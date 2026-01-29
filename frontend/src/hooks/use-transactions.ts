"use client";

import { transactionService } from "@/services/transaction.service";
import { useState } from "react";
import { toast } from "sonner";

export function useTransactions() {
  const [isChecking, setIsChecking] = useState(false);

  // Hàm này phục vụ việc xóa Category
  const checkRelatedTransactions = async (categoryId: string) => {
    setIsChecking(true);
    try {
      // Gọi API lấy 5 cái mới nhất
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
      setIsChecking(false);
    }
  };

  return {
    isChecking,
    checkRelatedTransactions,
  };
}
