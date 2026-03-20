"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/utils";
import { TransactionResponse, TransactionType } from "@/types/transaction.dto";
import { Wallet } from "@/types/wallet.dto";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  ArrowDownRight,
  ArrowUpRight,
  Edit,
  MoreHorizontal,
  Trash,
} from "lucide-react";

interface TransactionCardProps {
  transaction: TransactionResponse;
  wallet?: Wallet;
  onEdit: (tx: TransactionResponse) => void;
  onDelete: (id: string) => void;
}

export function TransactionCard({
  transaction: tx,
  wallet,
  onEdit,
  onDelete,
}: TransactionCardProps) {
  const isIncome = tx.type === TransactionType.INCOME;
  const txCurrency = wallet?.currency || "VND";
  const formattedAmount = `${isIncome ? "+" : "-"}${formatCurrency(tx.amount, txCurrency)}`;

  return (
    <div className="bg-card border rounded-xl p-4 flex items-center justify-between shadow-sm gap-2">
      {/* CỘT TRÁI 👇 FIX: Thêm flex-1 min-w-0 để ép nó tuân thủ giới hạn, không được đẩy cột phải */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className={`p-2 rounded-full shrink-0 ${
            isIncome
              ? "bg-emerald-100 text-emerald-600"
              : "bg-rose-100 text-rose-600"
          }`}
        >
          {isIncome ? (
            <ArrowDownRight className="h-5 w-5" />
          ) : (
            <ArrowUpRight className="h-5 w-5" />
          )}
        </div>

        {/* 👇 FIX: Thêm flex-1 min-w-0 ở đây nữa để các thẻ <p> bên trong được phép truncate */}
        <div className="space-y-1 flex-1 min-w-0">
          <p
            className="font-semibold text-sm truncate"
            title={tx.categoryName || "Khác"} // Gắn title để hover/đè tay vào sẽ hiện full tên
          >
            {tx.categoryName || "Khác"}
          </p>
          <p
            className="text-xs text-muted-foreground truncate"
            title={tx.note || wallet?.name || "Không rõ nguồn"}
          >
            {tx.note || wallet?.name || "Không rõ nguồn"}
          </p>
          <p className="text-[10px] text-muted-foreground/70">
            {format(new Date(tx.date), "dd/MM/yyyy", { locale: vi })}
          </p>
        </div>
      </div>

      {/* CỘT PHẢI 👇 FIX: shrink-0 giữ nguyên không bị bóp, giới hạn độ rộng số tiền max-w-[120px] trên Mobile */}
      <div className="flex items-center gap-2 shrink-0">
        <div
          className={`font-bold text-[15px] text-right truncate max-w-[100px] sm:max-w-[200px] ${
            isIncome ? "text-emerald-600" : "text-rose-600"
          }`}
          title={formattedAmount} // Hover vào sẽ thấy số tiền đầy đủ nếu bị cắt
        >
          {formattedAmount}
        </div>

        {/* Nút 3 chấm trên Mobile - Luôn hiển thị không bao giờ bị che */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 shrink-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(tx)}>
              <Edit className="mr-2 h-4 w-4" /> Sửa
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(tx.id)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash className="mr-2 h-4 w-4" /> Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
