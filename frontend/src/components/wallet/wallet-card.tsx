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
  Hammer,
  MoreVertical,
  Target,
  Trash,
  Wallet as WalletIcon,
  Zap,
} from "lucide-react";

const getWalletColor = (name: string) => {
  const colors = [
    "from-blue-500 to-cyan-400", // Xanh dương
    "from-emerald-500 to-teal-400", // Xanh ngọc
    "from-violet-500 to-fuchsia-400", // Tím
    "from-orange-500 to-amber-400", // Cam
    "from-rose-500 to-pink-400", // Đỏ hồng
    "from-indigo-500 to-blue-400", // Chàm
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};

interface WalletCardProps {
  wallet: Wallet;
  onEdit: (wallet: Wallet) => void;
  onDelete: (id: string) => void;
  onAddFund?: (wallet: Wallet) => void;
  onWithdraw?: (wallet: Wallet) => void;
}

export function WalletCard({
  wallet,
  onEdit,
  onDelete,
  onAddFund,
  onWithdraw,
}: WalletCardProps) {
  const isSaving = wallet.type === WalletType.SAVING;
  const isCompleted = isSaving && (wallet.percentage || 0) >= 100;

  const gradientColor = isCompleted
    ? "from-emerald-600 to-emerald-400"
    : getWalletColor(wallet.name);

  return (
    <Card
      className={`relative overflow-hidden transition-all hover:shadow-md group flex flex-col justify-between h-full min-h-[140px] border-t-0 ${
        isCompleted ? "bg-emerald-50/20" : ""
      }`}
    >
      <div
        className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${gradientColor}`}
      />

      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2 pt-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2 flex-1 min-w-0">
          <div className="shrink-0">
            {isSaving ? (
              isCompleted ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <Target className="h-4 w-4 text-blue-500" />
              )
            ) : (
              <WalletIcon className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <span
            className={`truncate ${
              isSaving
                ? "font-bold text-foreground"
                : "font-semibold text-foreground/90"
            }`}
            title={wallet.name}
          >
            {wallet.name}
          </span>
        </CardTitle>

        <div className="flex items-center gap-1 shrink-0">
          {isSaving && !isCompleted && onAddFund && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2 bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-700 font-semibold"
              onClick={() => onAddFund(wallet)}
            >
              <Zap className="h-3 w-3 sm:mr-1" fill="currentColor" />
              <span className="hidden sm:inline">Nạp</span>{" "}
              {/* Giấu chữ trên Mobile cho gọn */}
            </Button>
          )}

          {isSaving && wallet.balance > 0 && onWithdraw && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2 bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 hover:text-rose-700 font-semibold"
              onClick={() => onWithdraw(wallet)}
            >
              <Hammer className="h-3 w-3 sm:mr-1" fill="currentColor" />
              <span className="hidden sm:inline">Rút</span>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity md:opacity-0 opacity-100"
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
        </div>
      </CardHeader>

      <CardContent className={isSaving ? "pb-4" : ""}>
        <div className="flex justify-between items-end gap-2 w-full">
          {/* Cục hiển thị Số Dư (Tối đa 65% chiều ngang của Card) */}
          <div className="flex-1 min-w-0 max-w-[65%]">
            {isSaving && (
              <div className="text-xs text-muted-foreground mb-1">
                Đã tích lũy
              </div>
            )}
            <div
              className={`text-2xl font-bold truncate ${
                isCompleted ? "text-emerald-600" : ""
              }`}
              title={new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: wallet.currency || "VND",
              }).format(wallet.balance)}
            >
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: wallet.currency || "VND",
              }).format(wallet.balance)}
            </div>
          </div>

          {/* Cục hiển thị Mục Tiêu (Thu hẹp lại) */}
          {isSaving && wallet.targetAmount && (
            <div className="text-right shrink-0 max-w-[35%]">
              <div className="text-xs text-muted-foreground mb-1">Mục tiêu</div>
              <div
                className="text-sm font-medium truncate"
                title={new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: wallet.currency || "VND",
                }).format(wallet.targetAmount)}
              >
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: wallet.currency || "VND",
                }).format(wallet.targetAmount)}
              </div>
            </div>
          )}
        </div>

        {/* PROGRESS BAR */}
        {isSaving && (
          <div className="mt-4 space-y-1.5">
            <Progress
              value={wallet.percentage || 0}
              className="h-2.5 bg-muted"
              indicatorClassName={
                isCompleted
                  ? "bg-emerald-500"
                  : gradientColor.split(" ")[0].replace("from-", "bg-")
              }
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
        <CardFooter className="text-xs text-muted-foreground mt-auto pb-4">
          Tài khoản chi tiêu
        </CardFooter>
      )}
    </Card>
  );
}
