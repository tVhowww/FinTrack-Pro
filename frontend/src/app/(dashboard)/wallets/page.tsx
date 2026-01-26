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
import { Skeleton } from "@/components/ui/skeleton";
import { WalletDialog } from "@/components/wallet/wallet-dialog";
import { useWallets } from "@/hooks/use-wallets";
import { Wallet } from "@/types/wallet.dto";
import {
  Edit,
  MoreVertical,
  Plus,
  Trash,
  Wallet as WalletIcon,
} from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";

export default function WalletsPage() {
  const { wallets, isLoading, deleteWallet, isDeleting } = useWallets();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreate = () => {
    setSelectedWallet(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (wallet: Wallet) => {
    setSelectedWallet(wallet);
    setIsDialogOpen(true);
  };

  const confirmDelete = (id: string) => {
    setDeleteId(id);
  };

  const handleDeleteExecute = () => {
    if (deleteId) {
      deleteWallet(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Ví của tôi</h2>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> Thêm ví mới
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[150px] rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {wallets.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground py-10">
              Bạn chưa có ví nào. Hãy tạo ví đầu tiên!
            </div>
          )}

          {wallets.map((wallet) => (
            <Card
              key={wallet.id}
              className="relative overflow-hidden transition-all hover:shadow-md"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {wallet.name}
                </CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(wallet)}>
                      <Edit className="mr-2 h-4 w-4" /> Sửa thông tin
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => confirmDelete(wallet.id)}
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

              <div className="absolute left-0 top-0 h-full w-1 bg-primary" />
            </Card>
          ))}
        </div>
      )}

      <WalletDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        walletToEdit={selectedWallet}
      />

      <ConfirmDialog
        open={!!deleteId} // Có ID thì mở, null thì đóng
        onOpenChange={(open) => !open && setDeleteId(null)} // Đóng thì reset ID về null
        title="Xóa ví này?"
        description="Ví này sẽ bị vô hiệu hóa và ẩn khỏi danh sách của bạn. Bạn sẽ không thể thực hiện giao dịch mới trên ví này nữa."
        onConfirm={handleDeleteExecute}
        isLoading={isDeleting}
      />
    </div>
  );
}
