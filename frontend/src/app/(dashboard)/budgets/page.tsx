"use client";

import { BudgetCard } from "@/components/budget/budget-card";
import { BudgetDialog } from "@/components/budget/budget-dialog";
import { BudgetFilter } from "@/components/budget/budget-filter";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBudgets } from "@/hooks/use-budgets";
import { useWallets } from "@/hooks/use-wallets";
import { Plus, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@/hooks/use-user";

export default function BudgetsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingBudget, setEditingBudget] = useState<any | null>(null);

  const searchParams = useSearchParams();

  // Đọc params từ URL (Có fallback mặc định)
  const month = Number(searchParams.get("month")) || new Date().getMonth() + 1;
  const year = Number(searchParams.get("year")) || new Date().getFullYear();
  const walletId = searchParams.get("walletId") || "all";
  const keyword = searchParams.get("keyword") || undefined;
  const statusFilter = searchParams.get("status") || "ALL";

  const { wallets } = useWallets();
  const { user } = useUser();
  const baseCurrency = user?.baseCurrency || "VND";

  // Ném cục params xuống Hook
  const {
    budgets,
    isLoading,
    createBudget,
    deleteBudget,
    updateBudget,
    isDeleting,
  } = useBudgets({ month, year, walletId, keyword });

  // Lọc trạng thái bằng Frontend RAM (Dựa vào param URL)
  const displayBudgets = useMemo(() => {
    if (statusFilter === "ALL") return budgets;

    return budgets.filter((b) => {
      if (statusFilter === "SAFE") return b.percentage < 80;
      if (statusFilter === "WARNING")
        return b.percentage >= 80 && b.percentage <= 100;
      if (statusFilter === "DANGER") return b.percentage > 100;
      return true;
    });
  }, [budgets, statusFilter]);

  const handleSubmit = async (values: any) => {
    if (editingBudget) {
      await updateBudget({
        id: editingBudget.id,
        data: { name: values.name, amount: values.amount },
      });
    } else {
      await createBudget(values);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) setEditingBudget(null);
  };

  const handleDeleteExecute = async () => {
    if (deleteId) {
      await deleteBudget(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER TỔNG */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Quản lý Ngân sách
          </h2>
          <p className="text-sm text-muted-foreground">
            Kiểm soát chi tiêu tháng {month}/{year}
          </p>
        </div>

        <Button
          onClick={() => setIsDialogOpen(true)}
          className="w-full md:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" /> Tạo ngân sách mới
        </Button>
      </div>

      <BudgetFilter />

      {/* DANH SÁCH HIỂN THỊ */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[180px] rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {displayBudgets.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl bg-muted/20">
              <div className="bg-background p-4 rounded-full shadow-sm mb-4">
                <Search className="h-8 w-8 text-muted-foreground opacity-50" />
              </div>
              <p className="text-muted-foreground font-medium">
                {keyword || statusFilter !== "ALL"
                  ? "Không tìm thấy ngân sách nào phù hợp với bộ lọc."
                  : `Tháng ${month}/{year} chưa có ngân sách nào.`}
              </p>
              {!keyword && statusFilter === "ALL" && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setIsDialogOpen(true)}
                >
                  Bắt đầu lập kế hoạch ngay
                </Button>
              )}
            </div>
          ) : (
            displayBudgets.map((budget) => {
              let finalWalletName = budget.walletName;
              if (!finalWalletName && budget.walletId) {
                const matchedWallet = wallets.find(
                  (w) => w.id === budget.walletId,
                );
                finalWalletName = matchedWallet
                  ? matchedWallet.name
                  : "Ví không xác định";
              }
              if (!budget.walletId) finalWalletName = "Ngân sách chung";

              return (
                <BudgetCard
                  key={budget.id}
                  budget={budget}
                  walletName={finalWalletName as string}
                  baseCurrency={baseCurrency}
                  onEdit={() => {
                    setEditingBudget(budget);
                    setIsDialogOpen(true);
                  }}
                  onDelete={(id) => setDeleteId(id)}
                />
              );
            })
          )}
        </div>
      )}

      {/* DIALOGS */}
      <BudgetDialog
        open={isDialogOpen}
        onOpenChange={handleOpenChange}
        onSubmit={handleSubmit}
        budgetToEdit={editingBudget}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Xóa ngân sách?"
        description="Dữ liệu giao dịch sẽ không bị mất, nhưng theo dõi hạn mức sẽ bị xóa."
        onConfirm={handleDeleteExecute}
        isLoading={isDeleting}
      />
    </div>
  );
}
