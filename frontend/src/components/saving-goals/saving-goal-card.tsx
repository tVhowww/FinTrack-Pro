"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { SavingGoal } from "@/types/saving-goal.dto";
import {
  CalendarIcon,
  Target,
  CheckCircle2,
  Edit,
  MoreVertical,
  Trash,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface SavingGoalCardProps {
  goal: SavingGoal;
  onEdit: (goal: SavingGoal) => void;
  onDelete: (id: string) => void;
  footer?: React.ReactNode;
}

export function SavingGoalCard({
  goal,
  onEdit,
  onDelete,
  footer,
}: SavingGoalCardProps) {
  const isCompleted = goal.status === "COMPLETED" || goal.percentage >= 100;

  let progressColor = "bg-blue-600";
  if (isCompleted) progressColor = "bg-emerald-500";
  else if (goal.percentage >= 80) progressColor = "bg-yellow-500";

  return (
    <Card
      className={`relative overflow-hidden transition-all hover:shadow-md group ${isCompleted ? "border-emerald-200 bg-emerald-50/30" : ""}`}
    >
      <CardHeader className="pb-3 pr-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold flex items-center gap-2 pr-6">
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

          <div className="flex items-center gap-2">
            <Badge
              variant={isCompleted ? "default" : "secondary"}
              className={
                isCompleted ? "bg-emerald-500 hover:bg-emerald-600" : ""
              }
            >
              {isCompleted ? "Hoàn thành" : "Đang tích lũy"}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(goal)}>
                  <Edit className="mr-2 h-4 w-4" /> Sửa mục tiêu
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(goal.id)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash className="mr-2 h-4 w-4" /> Xóa quỹ này
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
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

        <div className="space-y-1.5">
          <Progress
            value={goal.percentage}
            className="h-2.5 bg-secondary"
            indicatorclassname={progressColor}
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

        {footer && <div className="pt-2">{footer}</div>}
      </CardContent>

      <div className={`absolute left-0 top-0 h-full w-1 ${progressColor}`} />
    </Card>
  );
}
