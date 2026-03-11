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
import {
  Edit,
  Globe,
  MoreVertical,
  Trash,
  WalletIcon,
  CalendarX,
  CalendarClock,
} from "lucide-react";
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
  const isGlobal = !budget.walletId;

  let statusColor = "bg-emerald-500";
  let statusText = "text-emerald-600";
  let progressBarColor = "bg-emerald-500";
  let badgeUI = null;

  switch (budget.status) {
    case "EXCEEDED":
      statusColor = "bg-rose-500";
      statusText = "text-rose-600 font-bold";
      progressBarColor = "bg-rose-500";
      break;
    case "EXPIRED":
      statusColor = "bg-slate-400";
      statusText = "text-slate-500";
      progressBarColor = "bg-slate-400";
      badgeUI = (
        <Badge
          variant="outline"
          className="text-[10px] px-2 h-5 gap-1 border-slate-300 text-slate-500 bg-slate-50"
        >
          <CalendarX className="h-3 w-3" /> Đã kết thúc
        </Badge>
      );
      break;
    case "UPCOMING":
      statusColor = "bg-blue-400";
      statusText = "text-blue-500";
      progressBarColor = "bg-blue-400";
      badgeUI = (
        <Badge
          variant="outline"
          className="text-[10px] px-2 h-5 gap-1 border-blue-300 text-blue-600 bg-blue-50"
        >
          <CalendarClock className="h-3 w-3" /> Sắp tới
        </Badge>
      );
      break;
    case "ACTIVE":
    default:
      if (percentage >= 80 && percentage < 100) {
        statusColor = "bg-amber-500";
        statusText = "text-amber-600 font-medium";
        progressBarColor = "bg-amber-500";
      }
      break;
  }

  // Tắt màu mè đi nếu đã hết hạn
  const isFaded = budget.status === "EXPIRED";

  return (
    <Card
      className={`relative overflow-hidden transition-all hover:shadow-md group ${isFaded ? "opacity-70 grayscale-[30%]" : ""}`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold truncate pr-4">
            {budget.name}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            {/* Hiển thị Badge Hết hạn / Sắp tới nếu có */}
            {badgeUI}

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
            <span className="text-xs text-muted-foreground whitespace-nowrap">
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
          <Progress
            value={percentage}
            className="h-2"
            indicatorClassName={progressBarColor}
          />

          <div className="flex justify-between text-xs">
            <span className={statusText}>
              {budget.status === "EXCEEDED"
                ? "Vượt hạn mức!"
                : `${percentage.toFixed(1)}%`}
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
