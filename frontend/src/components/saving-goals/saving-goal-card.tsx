"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { SavingGoal } from "@/types/saving-goal.dto";
import { CalendarIcon, Target, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface SavingGoalCardProps {
  goal: SavingGoal;
}

export function SavingGoalCard({ goal }: SavingGoalCardProps) {
  const isCompleted = goal.status === "COMPLETED" || goal.percentage >= 100;

  // Đổi màu thanh Progress theo tiến độ
  let progressColor = "bg-blue-600";
  if (isCompleted) progressColor = "bg-emerald-500";
  else if (goal.percentage >= 80) progressColor = "bg-yellow-500";

  return (
    <Card
      className={`relative overflow-hidden transition-all hover:shadow-md ${isCompleted ? "border-emerald-200 bg-emerald-50/30" : ""}`}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              {isCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : (
                <Target className="h-5 w-5 text-blue-500" />
              )}
              {goal.name}
            </CardTitle>
            <div className="flex items-center text-xs text-muted-foreground gap-1">
              <CalendarIcon className="h-3 w-3" />
              Hạn chót:{" "}
              {format(new Date(goal.deadline), "dd MMMM, yyyy", { locale: vi })}
            </div>
          </div>
          <Badge
            variant={isCompleted ? "default" : "secondary"}
            className={isCompleted ? "bg-emerald-500 hover:bg-emerald-600" : ""}
          >
            {isCompleted ? "Hoàn thành" : "Đang tích lũy"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Số tiền hiển thị */}
        <div className="flex justify-between items-end">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground mb-1">
              Đã gom được
            </span>
            <span
              className={`text-2xl font-bold ${isCompleted ? "text-emerald-600" : "text-primary"}`}
            >
              {formatCurrency(goal.currentAmount, goal.currency)}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs text-muted-foreground mb-1">Mục tiêu</span>
            <span className="text-sm font-medium">
              {formatCurrency(goal.targetAmount, goal.currency)}
            </span>
          </div>
        </div>

        {/* Thanh tiến độ */}
        <div className="space-y-1.5">
          {/* Mẹo nhỏ Tailwind: can thiệp thẳng vào class [&>div] để đổi màu lõi của shadcn Progress */}
          <Progress
            value={goal.percentage}
            className="h-2.5 bg-secondary"
            indicatorClassName={progressColor}
          />
          <div className="flex justify-between text-xs font-medium">
            <span
              className={isCompleted ? "text-emerald-600" : "text-blue-600"}
            >
              {goal.percentage.toFixed(1)}%
            </span>
            <span className="text-muted-foreground">
              {isCompleted
                ? "🎉 Chúc mừng!"
                : `Còn thiếu: ${formatCurrency(goal.targetAmount - goal.currentAmount, goal.currency)}`}
            </span>
          </div>
        </div>
      </CardContent>

      {/* Vạch kẻ màu báo hiệu trạng thái ở cạnh trái (Giống thẻ Budget của bác) */}
      <div className={`absolute left-0 top-0 h-full w-1 ${progressColor}`} />
    </Card>
  );
}
