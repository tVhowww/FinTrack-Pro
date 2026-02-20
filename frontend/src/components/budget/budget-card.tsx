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
import { Edit, Globe, MoreVertical, Trash, WalletIcon } from "lucide-react";
import { Badge } from "../ui/badge";

interface BudgetCardProps {
  budget: Budget;
  walletName: string;
  baseCurrency?: string;
  onEdit: (budget: Budget) => void;
  onDelete: (id: string) => void;
}

export function BudgetCard({
  budget,
  walletName,
  baseCurrency = "VND",
  onEdit,
  onDelete,
}: BudgetCardProps) {
  const currentSpent = budget.spentAmount || 0;
  const percentage =
    budget.percentage ?? Math.min((currentSpent / budget.amount) * 100, 100);
  const isOverBudget = currentSpent > budget.amount;

  // Xác định xem đây có phải là ngân sách chung (không thuộc ví nào cụ thể) không
  const isGlobal = !budget.walletId;

  // Logic màu sắc
  let statusColor = "bg-emerald-500";
  let statusText = "text-emerald-600";

  if (isOverBudget) {
    statusColor = "bg-red-500";
    statusText = "text-red-600 font-bold";
  } else if (percentage >= 80) {
    statusColor = "bg-yellow-500";
    statusText = "text-yellow-600 font-medium";
  }

  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-md group">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold truncate pr-4">
            {budget.name}
          </CardTitle>
          <div className="flex items-center gap-2">
            {isGlobal ? (
              <Badge
                variant="secondary"
                className="text-[10px] px-2 h-5 gap-1 bg-blue-100 text-blue-700 hover:bg-blue-200"
              >
                <Globe className="h-3 w-3" /> Ngân sách chung
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-[10px] px-2 h-5 gap-1 border-muted-foreground/40 text-muted-foreground"
              >
                <WalletIcon className="h-3 w-3" /> {walletName}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              • {budget.categoryName}
            </span>
          </div>
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

      <CardContent className="space-y-4 pt-2">
        <div className="flex justify-between items-end text-sm">
          <span className={`${statusText} text-lg font-bold`}>
            {formatCurrency(currentSpent, baseCurrency)}
          </span>
          <span className="text-muted-foreground text-xs mb-1">
            / {formatCurrency(budget.amount, baseCurrency)}
          </span>
        </div>

        <div className="space-y-1.5">
          <Progress value={percentage} className="h-2" />

          <div className="flex justify-between text-xs">
            <span className={statusText}>
              {isOverBudget ? "Vượt hạn mức!" : `${percentage.toFixed(1)}%`}
            </span>
            <span className="text-muted-foreground">
              Còn:{" "}
              {formatCurrency(
                Math.max(budget.amount - currentSpent, 0),
                baseCurrency,
              )}
            </span>
          </div>
        </div>
      </CardContent>

      <div className={`absolute left-0 top-0 h-full w-1 ${statusColor}`} />
    </Card>
  );
}
