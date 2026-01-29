import { categoryService } from "@/services/category.service";
import { CategoryCreationRequest, TransactionType } from "@/types/category.dto";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useCategories(type?: TransactionType) {
  const queryClient = useQueryClient();

  // Query Key để cache, nếu type đổi thì query key đổi -> auto refetch
  const queryKey = ["categories", type];

  const { data: categories = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => categoryService.getAll(type),
  });

  const createMutation = useMutation({
    mutationFn: categoryService.create,
    onSuccess: () => {
      toast.success("Tạo danh mục thành công");
      queryClient.invalidateQueries({ queryKey: ["categories"] }); // Refresh tất cả các list category
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Lỗi khi tạo danh mục");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryCreationRequest }) =>
      categoryService.update(id, data),
    onSuccess: () => {
      toast.success("Cập nhật thành công");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: categoryService.delete,
    onSuccess: () => {
      toast.success("Đã xóa danh mục");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: any) => {
      // Handle lỗi backend trả về (VD: System Readonly)
      toast.error(
        error.response?.data?.message || "Không thể xóa danh mục này",
      );
    },
  });

  return {
    categories,
    isLoading,
    createCategory: createMutation.mutate,
    updateCategory: updateMutation.mutate,
    deleteCategory: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
