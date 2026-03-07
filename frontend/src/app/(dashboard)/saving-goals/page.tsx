"use client";

import { SavingGoalCard } from "@/components/saving-goals/saving-goal-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSavingGoals } from "@/hooks/use-saving-goals";
import { Plus, PiggyBank } from "lucide-react";

export default function SavingGoalsPage() {
  const { goals, isLoading } = useSavingGoals();

  return (
    <div className="space-y-6">
      {/* Header */}
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
          onClick={() => alert("Form tạo mới mình làm ở Task 2 nhé sếp!")}
          className="w-full md:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" /> Tạo mục tiêu mới
        </Button>
      </div>

      {/* Danh sách Goals */}
      {isLoading ? (
        // Loading Skeletons
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[200px] rounded-xl" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        // Empty State
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-xl bg-muted/20">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <PiggyBank className="h-10 w-10 text-primary opacity-80" />
          </div>
          <h3 className="text-lg font-semibold mb-1">Chưa có mục tiêu nào</h3>
          <p className="text-muted-foreground mb-4 max-w-sm">
            Bạn chưa thiết lập quỹ tiết kiệm nào. Hãy tạo một mục tiêu mới như
            "Mua xe", "Đi du lịch" để có động lực phấn đấu nhé!
          </p>
          <Button
            onClick={() => alert("Form tạo mới mình làm ở Task 2 nhé sếp!")}
            variant="outline"
          >
            Bắt đầu lập quỹ ngay
          </Button>
        </div>
      ) : (
        // Grid Cards
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <SavingGoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </div>
  );
}
