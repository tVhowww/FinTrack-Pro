import { budgetService } from "@/services/budget.service";
import { BudgetCreationRequest, BudgetUpdateRequest } from "@/types/budget.dto";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface UseBudgetsParams {
  walletId?: string;
  month: number;
  year: number;
  keyword?: string;
}

export function useBudgets({
  walletId,
  month,
  year,
  keyword,
}: UseBudgetsParams) {
  const queryClient = useQueryClient();

  // 1. Query: Lấy danh sách
  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ["budgets", { walletId, month, year, keyword }],
    queryFn: () => budgetService.getAll({ walletId, month, year, keyword }),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // 2. Mutation: Tạo mới
  const createMutation = useMutation({
    mutationFn: (data: BudgetCreationRequest) => budgetService.create(data),
    onSuccess: () => {
      toast.success("Tạo ngân sách thành công!");
      queryClient.invalidateQueries({ queryKey: ["budgets"] }); // Refresh list
    },
    onError: (error: any) => {
      // Hiển thị lỗi từ Backend (ví dụ: Đã tồn tại budget cho category này)
      toast.error(error?.response?.data?.message || "Lỗi khi tạo ngân sách");
    },
  });

  // 3. Mutation: Xóa
  const deleteMutation = useMutation({
    mutationFn: (id: string) => budgetService.delete(id),
    onSuccess: () => {
      toast.success("Đã xóa ngân sách");
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
    onError: () => {
      toast.error("Không thể xóa ngân sách");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: BudgetUpdateRequest }) =>
      budgetService.update(id, data),
    onSuccess: () => {
      toast.success("Cập nhật ngân sách thành công!");
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
    onError: () => {
      toast.error("Lỗi khi cập nhật ngân sách");
    },
  });

  return {
    budgets: Array.isArray(budgets) ? budgets : [], // Fallback an toàn
    isLoading,
    createBudget: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    deleteBudget: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    updateBudget: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}
