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
import { Wallet } from "@/types/wallet.dto";
import { Edit, MoreVertical, Trash, Wallet as WalletIcon } from "lucide-react";

interface WalletCardProps {
  wallet: Wallet;
  onEdit: (wallet: Wallet) => void;
  onDelete: (id: string) => void;
}

export function WalletCard({ wallet, onEdit, onDelete }: WalletCardProps) {
  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-md group">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {wallet.name}
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
              <Trash className="mr-2 h-4 w-4" /> Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent>
        <div className="text-2xl font-bold">
          {new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: wallet.currency || "VND",
          }).format(wallet.balance)}
        </div>
      </CardContent>

      <CardFooter className="text-xs text-muted-foreground">
        <WalletIcon className="mr-1 h-3 w-3" /> Tài khoản cá nhân
      </CardFooter>

      {/* Đường viền màu bên trái cho đẹp */}
      <div className="absolute left-0 top-0 h-full w-1 bg-primary" />
    </Card>
  );
}
