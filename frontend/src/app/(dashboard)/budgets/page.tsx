"use client";

import { BudgetCard } from "@/components/budget/budget-card";
import { BudgetDialog } from "@/components/budget/budget-dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBudgets } from "@/hooks/use-budgets";
import { useWallets } from "@/hooks/use-wallets";
import { BudgetCreationRequest } from "@/types/budget.dto";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function BudgetsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(currentYear);
  const [selectedWalletId, setSelectedWalletId] = useState<string>("all");

  const { wallets } = useWallets();

  const { budgets, isLoading, createBudget, deleteBudget, isDeleting } =
    useBudgets({
      month,
      year,
      walletId: selectedWalletId,
    });

  const handleCreateSubmit = async (data: BudgetCreationRequest) => {
    await createBudget(data);
  };

  const handleDeleteExecute = async () => {
    if (deleteId) {
      await deleteBudget(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Quản lý Ngân sách
          </h2>
          <p className="text-sm text-muted-foreground">
            Kiểm soát chi tiêu tháng {month}/{year}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Lọc Ví */}
          <Select value={selectedWalletId} onValueChange={setSelectedWalletId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Chọn ví" />
            </SelectTrigger>
            <SelectContent>
              {/* Thêm lựa chọn Ngân sách chung ở đây */}
              <SelectItem value="all">Tất cả các ví</SelectItem>
              <SelectItem value="global">Ngân sách chung</SelectItem>
              {wallets.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Lọc Tháng */}
          <Select
            value={month.toString()}
            onValueChange={(v) => setMonth(Number(v))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Tháng" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <SelectItem key={m} value={m.toString()}>
                  Tháng {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Lọc Năm */}
          <Select
            value={year.toString()}
            onValueChange={(v) => setYear(Number(v))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Năm" />
            </SelectTrigger>
            <SelectContent>
              {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Tạo mới
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[180px] rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {budgets.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-10 text-center">
              <p className="text-muted-foreground mb-4">
                Tháng {month}/{year} chưa có ngân sách nào.
              </p>
            </div>
          ) : (
            budgets.map((budget) => {
              // 1. Ưu tiên lấy tên ví từ Backend (nếu bạn đã làm bước update BE trước đó)
              let finalWalletName = budget.walletName;

              // 2. Nếu Backend chưa có tên ví, ta tự dò từ danh sách wallets của Frontend
              if (!finalWalletName && budget.walletId) {
                const matchedWallet = wallets.find(
                  (w) => w.id === budget.walletId,
                );
                finalWalletName = matchedWallet
                  ? matchedWallet.name
                  : "Ví không xác định";
              }

              // 3. Nếu là ngân sách chung (walletId bị null)
              if (!budget.walletId) {
                finalWalletName = "Ngân sách chung";
              }

              return (
                <BudgetCard
                  key={budget.id}
                  budget={budget}
                  walletName={finalWalletName as string} // Truyền tên ví đã được chốt hạ vào đây
                  onEdit={() => toast.info("Tính năng đang phát triển")}
                  onDelete={(id) => setDeleteId(id)}
                />
              );
            })
          )}

          <button
            onClick={() => setIsDialogOpen(true)}
            className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-muted-foreground/25 p-8 text-center hover:bg-accent/50 hover:text-accent-foreground transition-all h-full min-h-[180px]"
          >
            <div className="rounded-full bg-background p-3 shadow-sm group-hover:scale-110 transition-transform">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold">Tạo ngân sách cho T{month}</h3>
              <p className="text-xs text-muted-foreground">
                Lập kế hoạch chi tiêu mới
              </p>
            </div>
          </button>
        </div>
      )}

      <BudgetDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleCreateSubmit}
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
