"use client";

import { savingGoalService } from "@/services/saving-goal.service";
import { FundAddRequest, SavingGoalRequest } from "@/types/saving-goal.dto";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useSavingGoals() {
  const queryClient = useQueryClient();

  // 1. Query: Lấy danh sách Goals
  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["saving-goals"],
    queryFn: savingGoalService.getAll,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // 2. Mutation: Tạo mới
  const createMutation = useMutation({
    mutationFn: (data: SavingGoalRequest) => savingGoalService.create(data),
    onSuccess: () => {
      toast.success("Tạo mục tiêu thành công!");
      queryClient.invalidateQueries({ queryKey: ["saving-goals"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Lỗi khi tạo mục tiêu");
    },
  });

  // 3. Mutation: Cập nhật
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SavingGoalRequest }) =>
      savingGoalService.update(id, data),
    onSuccess: () => {
      toast.success("Cập nhật mục tiêu thành công!");
      queryClient.invalidateQueries({ queryKey: ["saving-goals"] });
    },
    onError: () => toast.error("Lỗi khi cập nhật mục tiêu"),
  });

  // 4. Mutation: Xóa
  const deleteMutation = useMutation({
    mutationFn: (id: string) => savingGoalService.delete(id),
    onSuccess: () => {
      toast.success("Đã xóa mục tiêu");
      queryClient.invalidateQueries({ queryKey: ["saving-goals"] });
    },
    onError: () => toast.error("Không thể xóa mục tiêu"),
  });

  // 5. Mutation: Nạp tiền (Add Fund)
  const addFundMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FundAddRequest }) =>
      savingGoalService.addFund(id, data),
    onSuccess: (updatedGoal) => {
      if (updatedGoal.status === "COMPLETED") {
        toast.success("🎉 Chúc mừng sếp đã đạt mục tiêu!");
      } else {
        toast.success("Nạp tiền vào quỹ thành công!");
      }
      queryClient.invalidateQueries({ queryKey: ["saving-goals"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Lỗi khi nạp tiền");
    },
  });

  return {
    goals: Array.isArray(goals) ? goals : [],
    isLoading,
    createGoal: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateGoal: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteGoal: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    addFund: addFundMutation.mutateAsync,
    isAddingFund: addFundMutation.isPending,
  };
}
