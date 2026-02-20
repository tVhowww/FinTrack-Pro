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
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Edit, MoreHorizontal, Trash } from "lucide-react";

// Định nghĩa hành động (Sửa/Xóa) sẽ được truyền từ Component cha vào
interface TransactionActionsProps {
  transaction: TransactionResponse;
  onEdit: (transaction: TransactionResponse) => void;
  onDelete: (transaction: TransactionResponse) => void;
}

// Component Action cell tách riêng để code gọn
const ActionCell = ({
  transaction,
  onEdit,
  onDelete,
}: TransactionActionsProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(transaction)}>
          <Edit className="mr-2 h-4 w-4" /> Sửa
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onDelete(transaction)}
          className="text-red-600 focus:text-red-600"
        >
          <Trash className="mr-2 h-4 w-4" /> Xóa
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Hàm tạo columns nhận vào các handler
export const getColumns = (
  onEdit: (t: TransactionResponse) => void,
  onDelete: (t: TransactionResponse) => void,
  wallets: any[],
): ColumnDef<TransactionResponse>[] => [
  {
    accessorKey: "date",
    header: "Ngày",
    cell: ({ row }) => {
      // Format ngày: 30 thg 1, 2026
      return (
        <div className="text-sm font-medium">
          {format(new Date(row.original.date), "dd MMM, yyyy", { locale: vi })}
        </div>
      );
    },
  },
  {
    accessorKey: "category",
    header: "Danh mục",
    cell: ({ row }) => {
      const categoryName = row.original.categoryName || "Không phân loại";
      return <div className="text-sm">{categoryName}</div>;
    },
  },
  {
    accessorKey: "note",
    header: "Ghi chú",
    cell: ({ row }) => {
      return (
        <div className="text-sm text-muted-foreground truncate max-w-[200px]">
          {row.original.note || "-"}
        </div>
      );
    },
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Số tiền</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"));
      const type = row.original.type;

      // Màu sắc: Xanh (Thu) - Đỏ (Chi)
      const colorClass =
        type === TransactionType.INCOME ? "text-green-600" : "text-red-600";

      // Dấu: + hoặc -
      const prefix = type === TransactionType.INCOME ? "+" : "-";

      const txCurrency =
        wallets.find((w) => w.id === row.original.walletId)?.currency || "VND";

      return (
        <div className={`text-right font-bold ${colorClass}`}>
          {prefix}
          {formatCurrency(amount, txCurrency)}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <ActionCell
        transaction={row.original}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    ),
  },
];
