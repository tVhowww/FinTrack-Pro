"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import { Budget } from "@/types/budget.dto";
import { Edit, MoreVertical, Trash } from "lucide-react";

interface BudgetCardProps {
  budget: Budget;
  onEdit: (budget: Budget) => void;
  onDelete: (id: string) => void;
}

export function BudgetCard({ budget, onEdit, onDelete }: BudgetCardProps) {
  // 1. Tính toán logic
  const percentage = Math.min((budget.spent / budget.amount) * 100, 100);
  const isOverBudget = budget.spent > budget.amount;

  // 2. Logic màu sắc (Color Coding)
  // Quy định màu cho Border và Text trạng thái
  let statusColor = "bg-emerald-500"; // Mặc định: Xanh lá (An toàn)
  let statusText = "text-emerald-600";
  let progressIndicatorColor = "bg-emerald-500";

  if (isOverBudget) {
    statusColor = "bg-red-500";
    statusText = "text-red-600 font-bold";
    progressIndicatorColor = "bg-red-500";
  } else if (percentage >= 80) {
    statusColor = "bg-yellow-500";
    statusText = "text-yellow-600 font-medium";
    progressIndicatorColor = "bg-yellow-500";
  }

  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-md group">
      {/* Header: Tên & Menu */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">
            {budget.name}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {budget.categoryName} • Th{budget.month}/{budget.year}
          </p>
        </div>

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
            <DropdownMenuItem onClick={() => onEdit(budget)}>
              <Edit className="mr-2 h-4 w-4" /> Sửa hạn mức
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(budget.id)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash className="mr-2 h-4 w-4" /> Xóa ngân sách
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      {/* Content: Số tiền & Progress */}
      <CardContent className="space-y-4 pt-2">
        <div className="flex justify-between items-end text-sm">
          <span className={`${statusText} text-lg font-bold`}>
            {formatCurrency(budget.spent)}
          </span>
          <span className="text-muted-foreground text-xs mb-1">
            / {formatCurrency(budget.amount)}
          </span>
        </div>

        <div className="space-y-1.5">
          {/* Lưu ý về màu Progress Bar: 
            Mặc định Shadcn dùng 'bg-primary'. 
            Để đổi màu theo status, bạn có thể thêm class indicator vào component gốc 
            hoặc dùng css variable style={{ "--primary": ... }} nếu config tailwind hỗ trợ.
            Ở đây mình dùng indicator mặc định, nhưng status bar bên trái đã đủ để báo hiệu.
          */}
          <Progress value={percentage} className="h-2" />

          <div className="flex justify-between text-xs">
            <span className={statusText}>
              {isOverBudget ? "Vượt hạn mức!" : `${percentage.toFixed(0)}%`}
            </span>
            <span className="text-muted-foreground">
              Còn: {formatCurrency(Math.max(budget.amount - budget.spent, 0))}
            </span>
          </div>
        </div>
      </CardContent>

      <div className={`absolute left-0 top-0 h-full w-1 ${statusColor}`} />
    </Card>
  );
}
