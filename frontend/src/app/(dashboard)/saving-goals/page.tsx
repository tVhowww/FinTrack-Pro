"use client";

import { SavingGoalCard } from "@/components/saving-goals/saving-goal-card";
import { SavingGoalDialog } from "@/components/saving-goals/saving-goal-dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSavingGoals } from "@/hooks/use-saving-goals";
import { SavingGoal } from "@/types/saving-goal.dto";
import { Plus, PiggyBank } from "lucide-react";
import { useState } from "react";

export default function SavingGoalsPage() {
  const { goals, isLoading, createGoal, updateGoal, deleteGoal, isDeleting } =
    useSavingGoals();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingGoal | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) setEditingGoal(null);
  };

  const handleSubmit = async (values: any) => {
    if (editingGoal) {
      await updateGoal({ id: editingGoal.id, data: values });
    } else {
      await createGoal(values);
    }
  };

  const handleDeleteExecute = async () => {
    if (deleteId) {
      await deleteGoal(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header (giữ nguyên) */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <PiggyBank className="h-6 w-6 text-primary" /> Mục tiêu tiết kiệm
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gom góp từng ngày, xây dựng ước mơ lớn.
          </p>
        </div>

        <Button
          onClick={() => setIsDialogOpen(true)}
          className="w-full md:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" /> Tạo mục tiêu mới
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[200px] rounded-xl" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-xl bg-muted/20">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <PiggyBank className="h-10 w-10 text-primary opacity-80" />
          </div>
          <h3 className="text-lg font-semibold mb-1">Chưa có mục tiêu nào</h3>
          <p className="text-muted-foreground mb-4 max-w-sm">
            Bạn chưa thiết lập quỹ tiết kiệm nào. Hãy tạo một mục tiêu mới để có
            động lực phấn đấu nhé!
          </p>
          <Button onClick={() => setIsDialogOpen(true)} variant="outline">
            Bắt đầu lập quỹ ngay
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <SavingGoalCard
              key={goal.id}
              goal={goal}
              onEdit={(g) => {
                setEditingGoal(g);
                setIsDialogOpen(true);
              }}
              onDelete={(id) => setDeleteId(id)}
            />
          ))}
        </div>
      )}

      {/* Dialog Sửa / Tạo */}
      <SavingGoalDialog
        open={isDialogOpen}
        onOpenChange={handleOpenChange}
        onSubmit={handleSubmit}
        goalToEdit={editingGoal}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Xóa quỹ tiết kiệm?"
        description="Bạn có chắc chắn muốn xóa mục tiêu này không? Hành động này không thể hoàn tác."
        onConfirm={handleDeleteExecute}
        isLoading={isDeleting}
      />
    </div>
  );
}
