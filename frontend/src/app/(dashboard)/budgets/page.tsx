"use client";

import { BudgetCard } from "@/components/budget/budget-card";
import { BudgetDialog } from "@/components/budget/budget-dialog";
import { Button } from "@/components/ui/button";
import { MOCK_BUDGETS } from "@/types/budget.dto";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function BudgetsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(false);

  const handleCreate = () => {
    setEditingBudget(false);
    setIsDialogOpen(true);
  };

  const handleEdit = (budget: any) => {
    setEditingBudget(true);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    toast.success("Đã xóa ngân sách (Demo)");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Quản lý Ngân sách
          </h2>
          <p className="text-sm text-muted-foreground">
            Đặt hạn mức chi tiêu để kiểm soát tài chính tốt hơn.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> Tạo ngân sách
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {MOCK_BUDGETS.map((budget) => (
          <BudgetCard
            key={budget.id}
            budget={budget}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}

        <button
          onClick={handleCreate}
          className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-muted-foreground/25 p-8 text-center hover:bg-accent/50 hover:text-accent-foreground transition-all h-full min-h-[180px]"
        >
          <div className="rounded-full bg-background p-3 shadow-sm group-hover:scale-110 transition-transform">
            <Plus className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold">Tạo ngân sách mới</h3>
            <p className="text-xs text-muted-foreground">
              Lập kế hoạch cho tháng tới
            </p>
          </div>
        </button>
      </div>

      <BudgetDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        isEditMode={editingBudget}
      />
    </div>
  );
}
