"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Wallet, WalletType } from "@/types/wallet.dto";
import {
  CheckCircle2,
  Edit,
  MoreVertical,
  Target,
  Trash,
  Wallet as WalletIcon,
} from "lucide-react";

interface WalletCardProps {
  wallet: Wallet;
  onEdit: (wallet: Wallet) => void;
  onDelete: (id: string) => void;
}

export function WalletCard({ wallet, onEdit, onDelete }: WalletCardProps) {
  const isSaving = wallet.type === WalletType.SAVING;
  const isCompleted = isSaving && (wallet.percentage || 0) >= 100;

  // Đổi màu viền thẻ tùy theo loại và trạng thái
  let cardColor = "bg-primary";
  if (isSaving) {
    cardColor = isCompleted ? "bg-emerald-500" : "bg-blue-500";
  }

  return (
    <Card
      className={`relative overflow-hidden transition-all hover:shadow-md group flex flex-col justify-between ${
        isCompleted ? "border-emerald-200 bg-emerald-50/20" : ""
      }`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {isSaving ? (
            isCompleted ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <Target className="h-4 w-4 text-blue-500" />
            )
          ) : (
            <WalletIcon className="h-4 w-4 text-muted-foreground" />
          )}
          <span
            className={
              isSaving ? "font-bold text-foreground" : "text-muted-foreground"
            }
          >
            {wallet.name}
          </span>
        </CardTitle>
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
            <DropdownMenuItem onClick={() => onEdit(wallet)}>
              <Edit className="mr-2 h-4 w-4" /> Sửa thông tin
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(wallet.id)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash className="mr-2 h-4 w-4" /> Xóa ví
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className={isSaving ? "pb-4" : ""}>
        <div className="flex justify-between items-end">
          <div>
            {isSaving && (
              <div className="text-xs text-muted-foreground mb-1">
                Đã tích lũy
              </div>
            )}
            <div
              className={`text-2xl font-bold ${
                isCompleted ? "text-emerald-600" : ""
              }`}
            >
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: wallet.currency || "VND",
              }).format(wallet.balance)}
            </div>
          </div>
          {isSaving && wallet.targetAmount && (
            <div className="text-right">
              <div className="text-xs text-muted-foreground mb-1">Mục tiêu</div>
              <div className="text-sm font-medium">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: wallet.currency || "VND",
                }).format(wallet.targetAmount)}
              </div>
            </div>
          )}
        </div>

        {/* PROGRESS BAR CHO VÍ SAVING */}
        {isSaving && (
          <div className="mt-4 space-y-1.5">
            <Progress
              value={wallet.percentage || 0}
              className="h-2.5"
              indicatorClassName={cardColor}
            />
            <div className="flex justify-between text-xs font-medium">
              <span
                className={isCompleted ? "text-emerald-600" : "text-blue-600"}
              >
                {(wallet.percentage || 0).toFixed(1)}%
              </span>
              <span className="text-muted-foreground">
                {isCompleted
                  ? "🎉 Hoàn thành!"
                  : `Hạn chót: ${
                      wallet.deadline
                        ? new Date(wallet.deadline).toLocaleDateString("vi-VN")
                        : "--"
                    }`}
              </span>
            </div>
          </div>
        )}
      </CardContent>

      {!isSaving && (
        <CardFooter className="text-xs text-muted-foreground mt-auto">
          Tài khoản chi tiêu
        </CardFooter>
      )}

      {/* Đường viền màu bên trái */}
      <div className={`absolute left-0 top-0 h-full w-1 ${cardColor}`} />
    </Card>
  );
}